import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CreatePlaylistComponent } from '../create-playlist/create-playlist.component';
import { SongDataService } from '../song-data.service';
import { SpotifyApiService } from '../spotify-api.service';
import { FormBuilder, FormControl } from '@angular/forms';

@Component({
  selector: 'app-create-playlist-dialog',
  templateUrl: './create-playlist-dialog.component.html',
  styleUrls: ['./create-playlist-dialog.component.scss']
})
export class CreatePlaylistDialogComponent implements OnInit {

  name : string = "Playlist Name";
  collaborative : boolean = false;
  visibility : string = "Private";
  description : string = "Playlist description.";

  constructor(private dialogRef : MatDialogRef<CreatePlaylistComponent>,
              private spotifyAPI : SpotifyApiService,
              private track_data : SongDataService) { }

  ngOnInit(): void { }

  closeDialog(){
    this.dialogRef.close();
  }

  createPlaylist(){
    this.dialogRef.close();
    this.spotifyAPI.createPlaylist(this.track_data.getData(),
                                  this.name, 
                                  this.visibility.toString(),
                                  this.collaborative.toString(),
                                  this.description);
  }
}
