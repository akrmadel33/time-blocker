import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  day_number:number;
  day_string:string;
  hours:string;
  minutes:string;
  seconds:string;

  constructor() { }

  ngOnInit() {
    this.getTime();
    let timer = Observable.interval(1000).subscribe((res) => this.getTime());
  }



  getTime() {
    let time = new Date();

    this.day_number = time.getDate();
    this.day_string = time.toString().slice(0,3)

    this.hours = this.harold( time.getHours() );
    this.minutes = this.harold( time.getMinutes() );
    this.seconds = this.harold( time.getSeconds() );
  }

  harold(standIn) {
    if(standIn < 10) {
      standIn = '0' + standIn;
    }
    return standIn;
  }

}
