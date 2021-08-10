import { Component, OnInit } from '@angular/core';
import { SongDataService, TrackDataModel } from '../song-data.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CreatePlaylistDialogComponent } from '../create-playlist-dialog/create-playlist-dialog.component';
import { SpotifyApiService } from '../spotify-api.service';
import { Router } from '@angular/router';

export interface PlaylistData {
  name : string,
  public : boolean,
  collaborative : boolean,
  href : string,
  id : string,
  track_count : number,
  image: string
}

@Component({
  selector: 'app-create-playlist',
  templateUrl: './create-playlist.component.html',
  styleUrls: ['./create-playlist.component.scss']
})
export class CreatePlaylistComponent implements OnInit {

  public tracks : Array<TrackDataModel> = new Array<TrackDataModel>();
  playlists : Array<PlaylistData> = new Array<PlaylistData>();

  private dialogRef !: MatDialogRef<CreatePlaylistDialogComponent>;
  createDisabled = false;

  constructor(private track_service : SongDataService,
              private dialog : MatDialog,
              private spotify_api : SpotifyApiService,
              private router : Router) { }

  ngOnInit(): void {
    this.spotify_api.getPlaylists().then(data => {
      this.playlists = data as unknown as Array<PlaylistData>
    }).catch(() => {
      sessionStorage.removeItem("tracks");
      this.router.navigate(['/'])
    });
    if(sessionStorage.getItem("current_playlist_songs") == null || sessionStorage.getItem("current_playlist_songs")?.length == 0){
      var temp = this.track_service.getData();
      for(var i = 0; i < temp.length; i++){
        if(temp[i].selected == true) this.tracks.push(temp[i]); 
      }
      this.track_service.setData(this.tracks);
      sessionStorage.setItem("current_playlist_songs", JSON.stringify(this.tracks));
    } else {
      this.tracks = JSON.parse(sessionStorage.getItem("current_playlist_songs") as string) as Array<TrackDataModel>;
    }
  }
  openPlaylistCreateDialog(){
    this.dialogRef = this.dialog.open(CreatePlaylistDialogComponent);
    this.dialogRef.afterClosed().subscribe(result => {
      this.spotify_api.getPlaylists().then(data => {
        this.playlists = data as unknown as PlaylistData[];
        this.createDisabled = true;
      });
    })
  }
  closePlaylistCreateDialog(){
    this.dialogRef.close();
  }
  reloadPlaylists(){

  }
}
