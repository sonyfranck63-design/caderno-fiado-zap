.class public Lnet/mikespub/mywebview/MySavedStateModel;
.super Landroidx/lifecycle/ViewModel;
.source "MySavedStateModel.java"


# instance fields
.field private final mState:Landroidx/lifecycle/SavedStateHandle;


# direct methods
.method public constructor <init>(Landroidx/lifecycle/SavedStateHandle;)V
    .locals 0

    .line 21
    invoke-direct {p0}, Landroidx/lifecycle/ViewModel;-><init>()V

    .line 22
    iput-object p1, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    .line 23
    const-string p0, "Saved State"

    invoke-virtual {p1}, Ljava/lang/Object;->toString()Ljava/lang/String;

    move-result-object p1

    invoke-static {p0, p1}, Landroid/util/Log;->d(Ljava/lang/String;Ljava/lang/String;)I

    return-void
.end method


# virtual methods
.method getSettings(Landroidx/appcompat/app/AppCompatActivity;)Ljava/util/HashMap;
    .locals 2
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroidx/appcompat/app/AppCompatActivity;",
            ")",
            "Ljava/util/HashMap<",
            "Ljava/lang/String;",
            "Ljava/lang/Object;",
            ">;"
        }
    .end annotation

    .line 53
    new-instance v0, Ljava/util/HashMap;

    invoke-direct {v0}, Ljava/util/HashMap;-><init>()V

    .line 54
    const-string v1, "source"

    invoke-virtual {p0, v1}, Lnet/mikespub/mywebview/MySavedStateModel;->getValue(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object v1

    check-cast v1, Ljava/lang/String;

    if-nez v1, :cond_0

    .line 57
    invoke-static {p1}, Lnet/mikespub/mywebview/MySettingsRepository;->loadConfiguration(Landroidx/appcompat/app/AppCompatActivity;)Ljava/util/HashMap;

    move-result-object v0

    .line 58
    iget-object v1, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-static {v0, v1}, Lnet/mikespub/mywebview/MySettingsRepository;->setValuesFromMap(Ljava/util/HashMap;Landroidx/lifecycle/SavedStateHandle;)V

    .line 60
    const-string v1, "local_config"

    invoke-static {p1}, Lnet/mikespub/mywebview/MyLocalConfigRepository;->loadConfiguration(Landroidx/appcompat/app/AppCompatActivity;)Ljava/util/HashMap;

    move-result-object p1

    invoke-virtual {v0, v1, p1}, Ljava/util/HashMap;->put(Ljava/lang/Object;Ljava/lang/Object;)Ljava/lang/Object;

    .line 61
    iget-object p0, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-static {v0, p0}, Lnet/mikespub/mywebview/MyLocalConfigRepository;->setValuesFromMap(Ljava/util/HashMap;Landroidx/lifecycle/SavedStateHandle;)V

    goto :goto_0

    .line 63
    :cond_0
    iget-object p1, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-static {v0, p1}, Lnet/mikespub/mywebview/MySettingsRepository;->getMapFromValues(Ljava/util/HashMap;Landroidx/lifecycle/SavedStateHandle;)V

    .line 65
    iget-object p0, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-static {v0, p0}, Lnet/mikespub/mywebview/MyLocalConfigRepository;->getMapFromValues(Ljava/util/HashMap;Landroidx/lifecycle/SavedStateHandle;)V

    :goto_0
    return-object v0
.end method

.method getValue(Ljava/lang/String;)Ljava/lang/Object;
    .locals 0

    .line 33
    iget-object p0, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-virtual {p0, p1}, Landroidx/lifecycle/SavedStateHandle;->get(Ljava/lang/String;)Ljava/lang/Object;

    move-result-object p0

    return-object p0
.end method

.method setSettings(Landroidx/appcompat/app/AppCompatActivity;Ljava/util/HashMap;)Ljava/lang/String;
    .locals 0
    .annotation system Ldalvik/annotation/Signature;
        value = {
            "(",
            "Landroidx/appcompat/app/AppCompatActivity;",
            "Ljava/util/HashMap<",
            "Ljava/lang/String;",
            "Ljava/lang/Object;",
            ">;)",
            "Ljava/lang/String;"
        }
    .end annotation

    .line 79
    iget-object p0, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-static {p2, p0}, Lnet/mikespub/mywebview/MySettingsRepository;->setValuesFromMap(Ljava/util/HashMap;Landroidx/lifecycle/SavedStateHandle;)V

    .line 82
    invoke-static {p1, p2}, Lnet/mikespub/mywebview/MySettingsRepository;->saveConfiguration(Landroidx/appcompat/app/AppCompatActivity;Ljava/util/HashMap;)Ljava/lang/String;

    move-result-object p0

    return-object p0
.end method

.method setValue(Ljava/lang/String;Ljava/lang/Object;)V
    .locals 0

    .line 43
    iget-object p0, p0, Lnet/mikespub/mywebview/MySavedStateModel;->mState:Landroidx/lifecycle/SavedStateHandle;

    invoke-virtual {p0, p1, p2}, Landroidx/lifecycle/SavedStateHandle;->set(Ljava/lang/String;Ljava/lang/Object;)V

    return-void
.end method
