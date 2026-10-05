/**
 * GoogleDriveService - Serviço de Backup Automático e Sincronização em Nuvem
 * Integração com Google Identity Services (GIS) e Google Drive REST API v3
 */

(function() {
  'use strict';

  var STORAGE_KEYS = {
    CLIENT_ID: 'cf_gdrive_client_id',
    ACCESS_TOKEN: 'cf_gdrive_token',
    TOKEN_EXPIRES: 'cf_gdrive_token_expires',
    USER: 'cf_gdrive_user',
    LAST_SYNC: 'cf_gdrive_last_sync',
    AUTO_SYNC_ENABLED: 'cf_gdrive_autosync_enabled'
  };

  var BACKUP_FILENAME = 'cadernofiado_backup.json';
  var BACKUP_MIME_TYPE = 'application/json';

  // ID padrão oficial configurado no Google Cloud Console
  var DEFAULT_CLIENT_ID = '580165153784-3dulo8ltdg2efainliufacl2karedfle.apps.googleusercontent.com';

  var autoSyncTimer = null;
  var isSyncing = false;

  var GoogleDriveService = {
    /**
     * Obtém o Client ID configurado (salvo no localStorage ou padrão)
     */
    getClientId: function() {
      try {
        var saved = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
        if (saved && saved.trim()) return saved.trim();
      } catch (e) {}
      return window.CF_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
    },

    /**
     * Define e persiste um novo Client ID
     */
    setClientId: function(id) {
      try {
        if (!id || !id.trim()) {
          localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
        } else {
          localStorage.setItem(STORAGE_KEYS.CLIENT_ID, id.trim());
        }
        return true;
      } catch (e) {
        console.error('[GoogleDrive] Erro ao salvar Client ID:', e);
        return false;
      }
    },

    /**
     * Verifica se o serviço está configurado com um Client ID válido
     */
    isConfigured: function() {
      var id = this.getClientId();
      return !!(id && id.indexOf('.apps.googleusercontent.com') !== -1);
    },

    /**
     * Verifica se o usuário já realizou login e tem token salvo
     */
    isConnected: function() {
      try {
        var token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        var user = localStorage.getItem(STORAGE_KEYS.USER);
        return !!(token && user);
      } catch (e) {
        return false;
      }
    },

    /**
     * Obtém dados do usuário conectado (nome, email, foto)
     */
    getUser: function() {
      try {
        var data = localStorage.getItem(STORAGE_KEYS.USER);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Data e hora do último backup enviado
     */
    getLastSync: function() {
      try {
        return localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Status de auto-sync ativado
     */
    isAutoSyncEnabled: function() {
      try {
        var val = localStorage.getItem(STORAGE_KEYS.AUTO_SYNC_ENABLED);
        return val === null ? true : val === 'true';
      } catch (e) {
        return true;
      }
    },

    setAutoSyncEnabled: function(enabled) {
      try {
        localStorage.setItem(STORAGE_KEYS.AUTO_SYNC_ENABLED, enabled ? 'true' : 'false');
      } catch (e) {}
    },

    /**
     * Obtém o token atual, se não expirado
     */
    getValidToken: function() {
      try {
        var token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        var expires = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES);
        if (!token) return null;
        if (expires && Date.now() > parseInt(expires, 10)) {
          console.warn('[GoogleDrive] Token expirado');
          return null;
        }
        return token;
      } catch (e) {
        return null;
      }
    },

    /**
     * Garante que o script do Google Identity Services (GIS) esteja carregado
     */
    ensureGisLoaded: function() {
      return new Promise(function(resolve, reject) {
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
          resolve(window.google.accounts.oauth2);
          return;
        }

        var existingScript = document.getElementById('google-gsi-client');
        if (!existingScript) {
          existingScript = document.createElement('script');
          existingScript.id = 'google-gsi-client';
          existingScript.src = 'https://accounts.google.com/gsi/client';
          existingScript.async = true;
          existingScript.defer = true;
          document.head.appendChild(existingScript);
        }

        var timeout = setTimeout(function() {
          reject(new Error('Tempo limite excedido ao carregar os serviços de autenticação do Google. Verifique sua conexão com a internet.'));
        }, 10000);

        existingScript.onload = function() {
          clearTimeout(timeout);
          if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            resolve(window.google.accounts.oauth2);
          } else {
            reject(new Error('Biblioteca do Google Identity Services não foi inicializada corretamente.'));
          }
        };

        existingScript.onerror = function() {
          clearTimeout(timeout);
          reject(new Error('Falha ao conectar aos servidores do Google. Verifique se o aparelho possui conexão à internet.'));
        };
      });
    },

    /**
     * Conecta diretamente com um token OAuth 2.0 (Bearer ya29...)
     */
    connectWithToken: function(token, expiresInSeconds) {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!token || !token.trim()) {
          reject(new Error('Token de acesso inválido ou vazio.'));
          return;
        }

        var cleanToken = token.trim();
        // Se o usuário colou a URL inteira retornada pelo Google
        if (cleanToken.indexOf('access_token=') !== -1) {
          var match = cleanToken.match(/access_token=([^&]+)/);
          if (match) cleanToken = decodeURIComponent(match[1]);
        }
        if (cleanToken.startsWith('Bearer ')) {
          cleanToken = cleanToken.replace(/^Bearer\s+/i, '');
        }

        var expiresIn = parseInt(expiresInSeconds, 10) || 3600;
        var expiresAt = Date.now() + (expiresIn * 1000) - (60 * 1000);

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, cleanToken);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toString());

        self.fetchUserInfo(cleanToken).then(function(user) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
          if (window.AppState && typeof window.AppState.getBackupData === 'function') {
            self.uploadBackup(window.AppState.getBackupData()).catch(function(e) {
              console.warn('[GoogleDrive] Sync inicial falhou silenciosamente:', e);
            });
          }
          resolve({ success: true, user: user });
        }).catch(function(err) {
          var fallbackUser = { email: 'Conta Conectada', name: 'Usuário Google' };
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackUser));
          if (window.AppState && typeof window.AppState.getBackupData === 'function') {
            self.uploadBackup(window.AppState.getBackupData()).catch(function(e) {
              console.warn('[GoogleDrive] Sync inicial falhou silenciosamente:', e);
            });
          }
          resolve({ success: true, user: fallbackUser });
        });
      });
    },

    /**
     * Obtém a URL oficial de autorização OAuth 2.0 do Google (Fluxo Direto Web / Android)
     */
    getDirectAuthUrl: function(customClientId) {
      var clientId = customClientId || this.getClientId();
      var scopes = [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ');

      // Redirecionamento configurado no Google Cloud Console
      var redirectUri = 'https://sonyfranck63.github.io/caderno-fiado-zap';

      return 'https://accounts.google.com/o/oauth2/v2/auth' +
        '?client_id=' + encodeURIComponent(clientId) +
        '&redirect_uri=' + encodeURIComponent(redirectUri) +
        '&response_type=token' +
        '&scope=' + encodeURIComponent(scopes) +
        '&prompt=consent';
    },

    /**
     * Abre o fluxo de autenticação direta do Google no navegador (sem popup travando)
     */
    connect: function(customClientId) {
      var self = this;
      var clientId = customClientId || self.getClientId();

      return new Promise(function(resolve, reject) {
        if (!clientId) {
          reject(new Error('Por favor, configure o seu Client ID do Google Cloud Console antes de conectar.'));
          return;
        }

        try {
          var authUrl = self.getDirectAuthUrl(clientId);
          window.open(authUrl, '_blank');
          resolve({
            opened: true,
            authUrl: authUrl,
            message: 'Janela oficial de autorização do Google aberta no navegador.'
          });
        } catch (e) {
          reject(new Error('Erro ao abrir autorização do Google: ' + e.message));
        }
      });
    },

    /**
     * Busca dados básicos do perfil do usuário no Google
     */
    fetchUserInfo: function(token) {
      return fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(function(res) {
        if (!res.ok) throw new Error('Não foi possível obter dados da conta Google');
        return res.json();
      }).then(function(data) {
        return {
          email: data.email || 'Email não disponível',
          name: data.name || data.given_name || 'Comerciante',
          picture: data.picture || null
        };
      });
    },

    /**
     * Localiza o arquivo de backup existente no Google Drive
     */
    findExistingBackupFile: function(token) {
      var query = encodeURIComponent("name = '" + BACKUP_FILENAME + "' and trashed = false");
      var url = 'https://www.googleapis.com/drive/v3/files?q=' + query + '&fields=files(id,name,modifiedTime,size)&spaces=drive';

      return fetch(url, {
        headers: { 'Authorization': 'Bearer ' + token }
      }).then(function(res) {
        if (!res.ok) {
          if (res.status === 401) throw new Error('AUTH_EXPIRED');
          throw new Error('Falha ao buscar arquivo no Google Drive (status ' + res.status + ')');
        }
        return res.json();
      }).then(function(data) {
        if (data.files && data.files.length > 0) {
          return data.files[0];
        }
        return null;
      });
    },

    /**
     * Envia os dados de backup para o Google Drive (cria ou atualiza)
     */
    uploadBackup: function(backupData) {
      var self = this;
      if (isSyncing) return Promise.resolve({ skipped: true, reason: 'sync_in_progress' });
      isSyncing = true;

      return new Promise(function(resolve, reject) {
        var token = self.getValidToken();
        if (!token) {
          isSyncing = false;
          reject(new Error('AUTH_EXPIRED'));
          return;
        }

        var jsonString = typeof backupData === 'string' ? backupData : JSON.stringify(backupData, null, 2);

        // 1. Procurar se já existe o arquivo
        self.findExistingBackupFile(token).then(function(existingFile) {
          if (existingFile && existingFile.id) {
            // Atualizar arquivo existente (PATCH)
            var updateUrl = 'https://www.googleapis.com/upload/drive/v3/files/' + existingFile.id + '?uploadType=media';
            return fetch(updateUrl, {
              method: 'PATCH',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': BACKUP_MIME_TYPE
              },
              body: jsonString
            }).then(function(res) {
              if (!res.ok) throw new Error('Falha ao atualizar backup no Drive (status ' + res.status + ')');
              return res.json();
            });
          } else {
            // Criar novo arquivo (POST multipart)
            var metadata = {
              name: BACKUP_FILENAME,
              description: 'Backup de Segurança do Aplicativo CadernoFiado Zap',
              mimeType: BACKUP_MIME_TYPE
            };

            var boundary = '-------CadernoFiadoBoundary' + Date.now();
            var delimiter = '\r\n--' + boundary + '\r\n';
            var closeDelimiter = '\r\n--' + boundary + '--';

            var multipartBody = 
              delimiter +
              'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
              JSON.stringify(metadata) +
              delimiter +
              'Content-Type: ' + BACKUP_MIME_TYPE + '\r\n\r\n' +
              jsonString +
              closeDelimiter;

            var createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
            return fetch(createUrl, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'multipart/related; boundary=' + boundary
              },
              body: multipartBody
            }).then(function(res) {
              if (!res.ok) throw new Error('Falha ao criar arquivo de backup no Drive (status ' + res.status + ')');
              return res.json();
            });
          }
        }).then(function(result) {
          var nowIso = new Date().toISOString();
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowIso);
          isSyncing = false;
          resolve({
            success: true,
            timestamp: nowIso,
            fileId: result.id
          });
        }).catch(function(err) {
          isSyncing = false;
          reject(err);
        });
      });
    },

    /**
     * Baixa o arquivo de backup salvo no Google Drive do usuário
     */
    downloadBackup: function() {
      var self = this;
      return new Promise(function(resolve, reject) {
        var token = self.getValidToken();
        if (!token) {
          reject(new Error('AUTH_EXPIRED'));
          return;
        }

        self.findExistingBackupFile(token).then(function(file) {
          if (!file || !file.id) {
            throw new Error('Nenhum arquivo de backup do CadernoFiado foi encontrado no seu Google Drive.');
          }

          var downloadUrl = 'https://www.googleapis.com/drive/v3/files/' + file.id + '?alt=media';
          return fetch(downloadUrl, {
            headers: { 'Authorization': 'Bearer ' + token }
          }).then(function(res) {
            if (!res.ok) throw new Error('Falha ao baixar o arquivo do Drive (status ' + res.status + ')');
            return res.text();
          }).then(function(textData) {
            resolve({
              success: true,
              dataText: textData,
              fileInfo: file
            });
          });
        }).catch(reject);
      });
    },

    /**
     * Agenda sincronização automática silenciosa (Debounce de 4 segundos)
     */
    scheduleAutoSync: function(delayMs) {
      var self = this;
      if (!self.isConnected() || !self.isAutoSyncEnabled()) return;

      var delay = delayMs || 4000;
      if (autoSyncTimer) {
        clearTimeout(autoSyncTimer);
      }

      autoSyncTimer = setTimeout(function() {
        if (!window.AppState || typeof window.AppState.getBackupData !== 'function') return;
        var data = window.AppState.getBackupData();
        self.uploadBackup(data).then(function() {
          console.log('[GoogleDrive] Backup automático enviado com sucesso.');
        }).catch(function(err) {
          if (err.message === 'AUTH_EXPIRED') {
            console.warn('[GoogleDrive] Sessão expirada para auto-sync. Necessita reautenticação.');
          } else {
            console.warn('[GoogleDrive] Falha no auto-sync:', err.message);
          }
        });
      }, delay);
    },

    /**
     * Desconecta a conta e limpa todos os tokens locais
     */
    disconnect: function() {
      var token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token && window.google && window.google.accounts && window.google.accounts.oauth2) {
        try {
          window.google.accounts.oauth2.revoke(token, function() {});
        } catch (e) {}
      }

      try {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      } catch (e) {}

      if (autoSyncTimer) {
        clearTimeout(autoSyncTimer);
        autoSyncTimer = null;
      }
      return true;
    },

    /**
     * Detecta e processa automaticamente token retornado na URL (#access_token=...)
     */
    checkUrlHashToken: function() {
      try {
        var hash = window.location.hash || '';
        if (hash && hash.indexOf('access_token=') !== -1) {
          var match = hash.match(/access_token=([^&]+)/);
          if (match && match[1]) {
            var token = decodeURIComponent(match[1]);
            var expiresMatch = hash.match(/expires_in=([^&]+)/);
            var expiresIn = expiresMatch ? parseInt(expiresMatch[1], 10) : 3600;
            if (window.history && window.history.replaceState) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            return this.connectWithToken(token, expiresIn);
          }
        }
      } catch (e) {
        console.warn('[GoogleDrive] Erro ao verificar token na URL:', e);
      }
      return Promise.resolve(null);
    }
  };

  window.GoogleDriveService = GoogleDriveService;

  // Auto-detectar token na carga inicial se retornado por OAuth redirect
  try {
    GoogleDriveService.checkUrlHashToken();
  } catch (e) {}
})();

