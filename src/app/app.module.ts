import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HttpClientModule } from '@angular/common/http';
import { MusicPlayerComponent } from './components/music-player/music-player.component';
import {AngularSvgIconModule} from 'angular-svg-icon';


@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    MusicPlayerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    AngularSvgIconModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
