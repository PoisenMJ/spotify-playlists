import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';

export interface TrackDataModel {
  name: string,
  artist: string,
  genre: string,
  album: string,
  date_added: string, 
  selected: boolean,
  id: string,
  image: string
}

@Injectable({
  providedIn: 'root'
})
export class SongDataService {

  private track_data !: MatTableDataSource<TrackDataModel>;

  constructor() { }

  setData(d : Array<TrackDataModel>){
    this.track_data =  new MatTableDataSource<TrackDataModel>(d);
    return this.track_data;
  }
  getData(){ return this.track_data.data; }
  addData(d : TrackDataModel){ this.track_data.data.push(d);}

  checkSongsSaved(){
    return new Promise<boolean>(resolve => {
      var a = localStorage.getItem("tracks") ? true : false;
      resolve(a);
    })
  }

  saveSongs(){
    return new Promise<void>(resolve => {
      fetch("http://localhost:5000/save_songs", {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.track_data.data)
      }).then(() => resolve());
    })
  }

  clearSongs(){
    return new Promise<void>(resolve => {
      fetch("http://localhost:5000/clear_songs").then(data => data.json()).then(json_data => resolve(json_data));
    })
  }

  getSavedSongs(){
    return new Promise<void>(resolve => {
      resolve(JSON.parse(localStorage.getItem("tracks") as string));
    })
  }

  removeData(trackID : String){
    for(var i = 0; i < this.track_data.data.length; i++){
      if(this.track_data.data[i].id == trackID) {
        var new_array = this.track_data.data.splice(0, i-1)
        new_array = new_array.concat(this.track_data.data.splice(i+1, (this.track_data.data.length - (i-1))))
        this.track_data.data = new_array
      }
    }
  }
}
