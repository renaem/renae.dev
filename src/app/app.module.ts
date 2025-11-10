import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import {AngularSvgIconModule} from 'angular-svg-icon';
import { LazyImgDirective } from './directives/lazy-img.directive';
import { LoaderComponent } from './components/loader/loader.component';


@NgModule({ declarations: [
        AppComponent,
        NavMenuComponent,
        MusicPlayerComponent,
        LoaderComponent,
        LazyImgDirective
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        BrowserAnimationsModule,
        AppRoutingModule,
        AngularSvgIconModule.forRoot()], providers: [
        provideClientHydration(),
        provideHttpClient(withInterceptorsFromDi())
    ] })
export class AppModule { }
