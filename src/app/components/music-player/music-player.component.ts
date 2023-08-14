import { Component, OnInit } from '@angular/core';
import anime from 'animejs/lib/anime.es.js';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'app-music-player',
  templateUrl: './music-player.component.html',
})
export class MusicPlayerComponent implements OnInit {
  userName: string;
  apiKey: string;
  recentTrack;

  constructor(private http: HttpClient) {
    this.userName = environment.LAST_FM_USER;
    this.apiKey = environment.LAST_FM_API;
   }

  ngOnInit(): void {
    this.getStreamingData();
  }

  getStreamingData() {
    const mostRecentApiUrl = 'https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + this.userName + '&api_key=' + this.apiKey + '&limit=1&format=json';
    this.http.get(mostRecentApiUrl).subscribe(
      (data) => {
        // Handle the API response data here
        this.recentTrack = data['recenttracks'].track[0];
      },
      (error) => {
        // Handle error, if any
        console.error('Error:', error);
      }
    );
  }
}
