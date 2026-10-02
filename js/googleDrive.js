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
     * Abre o fluxo de autenticação do Google e salva o token
     */
    connect: function(customClientId) {
      var self = this;
      var clientId = customClientId || self.getClientId();

      return new Promise(function(resolve, reject) {
        if (!clientId) {
          reject(new Error('Por favor, configure o seu Client ID do Google Cloud Console antes de conectar.'));
          return;
        }

        self.ensureGisLoaded().then(function(oauth2) {
          try {
            var tokenClient = oauth2.initTokenClient({
              client_id: clientId,
              scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
              callback: function(tokenResponse) {
                if (tokenResponse.error) {
                  var errText = tokenResponse.error_description || tokenResponse.error;
                  if (tokenResponse.error === 'popup_closed_by_user') {
                    errText = 'O login foi cancelado antes de ser concluído.';
                  } else if (tokenResponse.error === 'access_denied') {
                    errText = 'Permissão de acesso ao Google Drive negada pelo usuário.';
                  }
                  reject(new Error(errText));
                  return;
                }

                var token = tokenResponse.access_token;
                var expiresIn = parseInt(tokenResponse.expires_in, 10) || 3600;
                var expiresAt = Date.now() + (expiresIn * 1000) - (60 * 1000); // margem de 1min

                localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
                localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES, expiresAt.toString());

                // Buscar perfil do usuário para exibir na tela
                self.fetchUserInfo(token).then(function(user) {
                  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
                  // Dispara primeiro sync automático
                  if (window.AppState && typeof window.AppState.getBackupData === 'function') {
                    self.uploadBackup(window.AppState.getBackupData()).catch(function(e) {
                      console.warn('[GoogleDrive] Sync inicial falhou silenciosamente:', e);
                    });
                  }
                  resolve({ success: true, user: user });
                }).catch(function(err) {
                  // Fallback se perfil falhar, ainda salva com email genérico
                  var fallbackUser = { email: 'Conta Conectada', name: 'Usuário Google' };
                  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(fallbackUser));
                  resolve({ success: true, user: fallbackUser });
                });
              },
              error_callback: function(err) {
                console.error('[GoogleDrive] Erro GIS:', err);
                reject(new Error(err.message || 'Erro ao inicializar janela do Google'));
              }
            });

            tokenClient.requestAccessToken({ prompt: 'consent' });
          } catch (e) {
            reject(new Error('Erro ao iniciar login Google: ' + e.message));
          }
        }).catch(reject);
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
    }
  };

  window.GoogleDriveService = GoogleDriveService;
})();
