import { Component, OnInit } from '@angular/core';
import { SongDataService, TrackDataModel } from '../song-data.service';

@Component({
  selector: 'app-create-playlist',
  templateUrl: './create-playlist.component.html',
  styleUrls: ['./create-playlist.component.scss']
})
export class CreatePlaylistComponent implements OnInit {

  tracks : Array<TrackDataModel> = new Array<TrackDataModel>();

  constructor(private track_service : SongDataService) { }

  ngOnInit(): void {
    var temp = this.track_service.getData();
    for(var i = 0; i < temp.length; i++){
      if(temp[i].selected == true){
        this.tracks.push(temp[i]);
      }
    }
  }

}
