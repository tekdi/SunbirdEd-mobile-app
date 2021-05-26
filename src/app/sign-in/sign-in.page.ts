import {Component, Inject, OnInit} from '@angular/core';
import {
    AppHeaderService,
    CommonUtilService,
    FormAndFrameworkUtilService,
    LoginHandlerService
} from '@app/services';
import {
    WebviewStateSessionProviderConfig,
    WebviewRegisterSessionProviderConfig,
    WebviewStateSessionProvider,
    WebviewSessionProviderConfig,
    WebviewLoginSessionProvider,
    NativeGoogleSessionProvider,
    AuthService
} from 'sunbird-sdk';
import {Router} from '@angular/router';
import {SbProgressLoader} from '@app/services/sb-progress-loader.service';
import {LoginNavigationHandlerService} from '@app/services/login-navigation-handler.service';
import {GooglePlus} from '@ionic-native/google-plus/ngx';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.page.html',
    styleUrls: ['./sign-in.page.scss'],
    providers: [LoginNavigationHandlerService]
})
export class SignInPage implements OnInit {
    appName = '';
    skipNavigation: any;
    userData: any = {};

    constructor(
        @Inject('AUTH_SERVICE') private authService: AuthService,
        private appHeaderService: AppHeaderService,
        private commonUtilService: CommonUtilService,
        private loginHandlerService: LoginHandlerService,
        private router: Router,
        private formAndFrameworkUtilService: FormAndFrameworkUtilService,
        private sbProgressLoader: SbProgressLoader,
        private loginNavigationHandlerService: LoginNavigationHandlerService,
        private googlePlusLogin: GooglePlus
    ) {
        this.skipNavigation = this.router.getCurrentNavigation().extras.state;
    }

    async ngOnInit() {
        this.appHeaderService.showHeaderWithBackButton();
        this.appName = await this.commonUtilService.getAppName();
    }

    loginWithKeyCloak() {
        this.loginHandlerService.signIn(this.skipNavigation);
    }

    async loginWithStateSystem(skipNavigation = this.skipNavigation) {
        const webviewSessionProviderConfigLoader = await this.commonUtilService.getLoader();
        let webviewStateSessionProviderConfig: WebviewStateSessionProviderConfig;
        let webviewMigrateSessionProviderConfig: WebviewSessionProviderConfig;
        await webviewSessionProviderConfigLoader.present();
        try {
            webviewStateSessionProviderConfig = await this.formAndFrameworkUtilService.getWebviewSessionProviderConfig('state');
            webviewMigrateSessionProviderConfig = await this.formAndFrameworkUtilService.getWebviewSessionProviderConfig('migrate');
            await webviewSessionProviderConfigLoader.dismiss();
        } catch (e) {
            await this.sbProgressLoader.hide({id: 'login'});
            await webviewSessionProviderConfigLoader.dismiss();
            this.commonUtilService.showToast('ERROR_WHILE_LOGIN');
            return;
        }
        const webViewStateSession = new WebviewStateSessionProvider(
            webviewStateSessionProviderConfig,
            webviewMigrateSessionProviderConfig
        );
        await this.loginNavigationHandlerService.setSession(webViewStateSession, skipNavigation);
    }

    async signInWithGoogle() {
        this.googlePlusLogin.login({
            webClientId: '525350998139-cjr1m4a2p1i296p588vff7qau924et79.apps.googleusercontent.com'
        }).then(async (result) => {
            this.userData = result;
            const nativeSessionGoogleProvider = new NativeGoogleSessionProvider(() => result);
            await this.loginNavigationHandlerService.setSession(nativeSessionGoogleProvider, this.skipNavigation);
        }).catch(async (result) => {
            this.userData = result;
            const nativeSessionGoogleProvider = new NativeGoogleSessionProvider(() => result);
            await this.loginNavigationHandlerService.setSession(nativeSessionGoogleProvider, this.skipNavigation);
        });
    }

    async register(skipNavigation = this.skipNavigation) {
        const webviewSessionProviderConfigLoader = await this.commonUtilService.getLoader();
        let webviewRegisterSessionProviderConfig: WebviewRegisterSessionProviderConfig;
        let webviewMigrateSessionProviderConfig: WebviewSessionProviderConfig;
        await webviewSessionProviderConfigLoader.present();
        try {
            webviewRegisterSessionProviderConfig = await this.formAndFrameworkUtilService.getWebviewSessionProviderConfig('register');
            webviewMigrateSessionProviderConfig = await this.formAndFrameworkUtilService.getWebviewSessionProviderConfig('migrate');
            await webviewSessionProviderConfigLoader.dismiss();
        } catch (e) {
            await this.sbProgressLoader.hide({id: 'login'});
            await webviewSessionProviderConfigLoader.dismiss();
            this.commonUtilService.showToast('ERROR_WHILE_LOGIN');
            return;
        }
        const webViewRegisterSession = new WebviewLoginSessionProvider(
            webviewRegisterSessionProviderConfig,
            webviewMigrateSessionProviderConfig
        );
        await this.loginNavigationHandlerService.setSession(webViewRegisterSession, skipNavigation);
    }

}
