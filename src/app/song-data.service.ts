import { Injectable } from '@angular/core';
import { SpotifyApiService } from './spotify-api.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';

export interface TrackDataModel {
  name: string,
  artist: string,
  genre: string,
  album: string,
  date_added: string,
  position: number,
  selected: boolean,
  id: string,
  image: string
}

@Injectable({
  providedIn: 'root'
})
export class SongDataService {

  private track_data !: MatTableDataSource<TrackDataModel>;

  constructor(private spotify_api : SpotifyApiService) { }

  setData(d : Array<TrackDataModel>){ 
    this.track_data = new MatTableDataSource<TrackDataModel>(d); 
  }
  getMatTable(){ return this.track_data; }
  getData(){ return this.track_data.data; }
  addData(d : TrackDataModel){ this.track_data.data.push(d);}
  removeData(trackID : String){
    for(var i = 0; i < this.track_data.data.length; i++){
      if(this.track_data.data[i].id == trackID) {
        var new_array = this.track_data.data.splice(0, i-1)
        new_array = new_array.concat(this.track_data.data.splice(i+1, (this.track_data.data.length - (i-1))))
        this.track_data.data = new_array
      }
    }
  }

  setPaginator(p : MatPaginator){ this.track_data.paginator = p; }
}
