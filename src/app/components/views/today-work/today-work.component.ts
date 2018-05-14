import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import * as $ from 'jquery';
import * as _ from 'lodash';

import { ElementsService } from '../../../services/elements.service';

@Component({
  selector: 'app-today-work',
  templateUrl: './today-work.component.html',
  styleUrls: ['./today-work.component.scss'],

  encapsulation: ViewEncapsulation.None
})
export class TodayWorkComponent implements OnInit {

  countDown = setInterval(function(){}, 1000);
  subTaskTime:number = 0;

  constructor(public elements:ElementsService) { }

  ngOnInit() {
    $(document).ready( () => this.addTask() );

    let checkSubTask = setInterval(() => {
      if(this.subTaskTime <= 0) { clearInterval(this.countDown) }
    }, 500)

    // listen to when window resize or when scroll bar appear
    $(document).ready(() => {
      window.addEventListener('resize', () => {
        this.resetWidth();
      });

      // Create an invisible iframe
      var iframe = document.createElement('iframe');
      iframe.id = "hacky-scrollbar-resize-listener";
      iframe.style.cssText = 'height: 0; background-color: transparent; margin: 0; padding: 0; overflow: hidden; border-width: 0; position: absolute; width: 100%;';

      // Register our event when the iframe loads
      iframe.onload = function() {
        // The trick here is that because this iframe has 100% width
        // it should fire a window resize event when anything causes it to
        // resize (even scrollbars on the outer document)
        iframe.contentWindow.addEventListener('resize', function() {
          try {
            var evt = document.createEvent('UIEvents');
            evt.initUIEvent('resize', true, false, window, 0);
            window.dispatchEvent(evt);
          } catch(e) {}
        });
      };

      // Stick the iframe somewhere out of the way
      document.body.appendChild(iframe);
    })
  }

  addTask() {
    let _this = this;

    $('.actions .icon-plus').on('click', function() {
      $('.work-container').append(_this.elements.task);
      _this.taskAction();
    });
  }

  taskAction() {
    let _this = this;

    $('.work-container .task:last-child .task-action').on('click', function() {
      // approve task
      if($(this).hasClass('icon-checkmark')) {
        $(this).removeClass('icon-checkmark').addClass('icon-cross');

        let taskName = $(this).next().children('input').val();
        $(this).next().children('input').remove();
        $(this).next().append(_this.elements.divInput);
        $(this).next().children('.input').text(taskName);

        $(this).parent().append(_this.elements.taskTime);

        $(this).next().append(_this.elements.taskLoader);
        let width = $(window).width() - $(this).next().children('.task-loader').offset().left - 10;
        $(this).next().children('.task-loader').width(width)

        _this.addSubTask($(this).next().children('.icon-plus'));

      // delete task
      } else {
        $(this).parent().nextUntil('.task').remove();
        $(this).parent().remove();
      }
    });
  }

  addSubTask($el) {
    let _this = this;

    $el.on('click', function() {
      // new subTask
      if($(this).parents('.task').nextAll('.sub-task').length == 0) {
        $(this).parents('.task').after(_this.elements.subTask);

      // additional subTask
      } else {
        let subTasks = $(this).parents('.task').nextUntil('.task');
        $(subTasks[subTasks.length-1]).after(_this.elements.subTask);
      }

      _this.subTaskClock( $(this).parents('.task'), true );
      _this.subTaskAction( $(this).parents('.task') );
    });
  }

  subTaskClock($el, newEl:boolean) {
    let _this = this;

    let el;
    if(newEl) {
      el = $el.nextAll('.sub-task')[$el.nextAll('.sub-task').length-1];
    } else {
      el = $el
    }

    $(el).children('.hours-controller').children('span').on('click', function() {
      if($(this).hasClass('icon-chevron-up')) {
        changeTime($(this).parent().prev() , true, true);
      } else {
        changeTime($(this).parent().prev(), false, true);
      }
    });

    $(el).children('.minutes-controller').children('span').on('click', function() {
      if($(this).hasClass('icon-chevron-up')) {
        changeTime($(this).parent().prev() , true, false);
      } else {
        changeTime($(this).parent().prev(), false, false);
      }
    })

    function changeTime(el:any, add:boolean, hour:boolean) {
      let time:any = +el.text();
      if(add) {
        (hour) ? time ++ : time += 10;
        (time < 10) ? time = '0' + time : time;
        (time > 59) ? time = '00' : time;
      } else {
        (hour) ? time -- : time -= 10;
        (time < 0)  ? time = '59' : time;
        (time < 10) ? time = '0' + time : time;
      }
      if(time == '59') { (hour) ? false : time = '50' }

      el.text(time);
    }
  }

  // approve a task or modify a task
  subTaskAction($el) {
    let _this = this;

    let el = $el.nextUntil('.task')[$el.nextUntil('.task').length-1];
    $(el).children('.sub-task-action').on('click', function() {
      // approve subTask
      if($(this).hasClass('icon-checkmark')) {
        $(this).removeClass('icon-checkmark').addClass('icon-cog');

        let subtaskName = $(this).next().children('input').val();
        $(this).next().children('input').remove();
        $(this).next().append(_this.elements.subDivInput);
        $(this).next().children('.input').text(subtaskName);

        $(this).nextAll('.hours-controller').remove();
        $(this).nextAll('.minutes-controller').remove();
        _this.taskTime( $(this).parent().prevAll('.task')[0], true );

        $(this).next().append(_this.elements.subTaskLoader);
        let width = $(window).width() - $(this).next().children('.sub-task-loader').offset().left - 10;
        $(this).next().children('.sub-task-loader').width(width);
        // set data-sub-task-time
        let time = +$(this).nextAll('.sub-task-hours').text() * 3600 + +$(this).nextAll('.sub-task-minutes').text() * 60 + +$(this).nextAll('.sub-task-seconds').text();
        $(this).next().children('.sub-task-loader').data('sub-task-time', time);

        $(this).parent().append(_this.elements.miniActions);
        _this.subTaskMiniActions($(this).parent());

      // modify subTask
      } else {
        ( $(this).nextAll('.sub-task-mini-action').hasClass('open') ) ? $(this).nextAll('.sub-task-mini-action').removeClass('open') : $(this).nextAll('.sub-task-mini-action').addClass('open')
      }
    });
  }

  taskTime(task, newEl:boolean) {
    let _this = this;
    let fullTime:number = 0;  // <-- in seconds

    let subTasksArray = $(task).nextUntil('.task');
    _.forEach(subTasksArray, function(val) {
      if( $(val).children('.sub-task-action').hasClass('icon-cog') ) {
        fullTime += +$(val).children('.sub-task-hours').text() * 60 * 60;
        fullTime += +$(val).children('.sub-task-minutes').text() * 60;
        fullTime += +$(val).children('.sub-task-seconds').text();
      }
    });

    let time:any = Math.floor(fullTime/3600);
    ( time < 10 ) ? time = '0' + time : time;
    $(task).children('.task-hours').text(time);
    time =  Math.floor(fullTime/60) - time * 60;
    ( time < 10 ) ? time = '0' + time : time;
    $(task).children('.task-minutes').text(time);
    time = fullTime - Math.floor(fullTime/60)*60;
    ( time < 10 ) ? time = '0' + time : time;
    $(task).children('.task-seconds').text(time);

    let width = $(window).width() - $(task).children('.task-name').children('.task-loader').offset().left - 10;
    if(newEl) {
      // set data-task-time
      // console.log('dataTime', fullTime);
      $(task).children('.task-name').children('.task-loader').data('task-time', fullTime);
      // reset the width
      $(task).children('.task-name').children('.task-loader').width(width);
    }
  }

  subTaskMiniActions($el) {
    let _this = this;

    $el.children('.sub-task-mini-action').on('click', function() {

      if( $(this).hasClass('icon-cross') ) {
        let task = $el.prevAll('.task')[0];
        $el.remove();
        $(task).children('.task-seconds').text('00');
        _this.taskTime( task, true );

      } else if( $(this).hasClass('icon-pencil') ) {
        $(this).removeClass('icon-pencil').addClass('icon-checkmark');
        $el.children('.sub-task-hours').after(_this.elements.subHourController);
        $el.children('.sub-task-minutes').after(_this.elements.subMinuteController);
        _this.subTaskClock($el, false);

      } else if( $(this).hasClass('icon-checkmark') ) {
        $(this).removeClass('icon-checkmark').addClass('icon-pencil');
        $el.children('.hours-controller').remove();
        $el.children('.minutes-controller').remove();
        _this.taskTime( $el.prevAll('.task')[0], true );
        // set data-sub-task-time
        let time = +$el.children('.sub-task-hours').text() * 3600 + +$el.children('.sub-task-minutes').text() * 60 + +$el.children('.sub-task-seconds').text();
        $el.children('.sub-task-name').children('.sub-task-loader').data('sub-task-time', time);
        // reset the width
        let width = $(window).width() - $el.children('.sub-task-name').children('.sub-task-loader').offset().left - 10;
        $el.children('.sub-task-name').children('.sub-task-loader').width(width);

      } else if( $(this).hasClass('icon-play3') ) {
        $(this).removeClass('icon-play3').addClass('icon-pause2');
        _this.countingDown($el);

      } else if( $(this).hasClass('icon-pause2') ) {
        clearInterval(_this.countDown);
        $(this).removeClass('icon-pause2').addClass('icon-play3');
      }

    });
  }

  countingDown($el){
    clearInterval(this.countDown);
    let _this = this;

    this.subTaskTime = 0;
    this.subTaskTime += +$el.children('.sub-task-hours').text() * 60 * 60;
    this.subTaskTime += +$el.children('.sub-task-minutes').text() * 60;
    this.subTaskTime += +$el.children('.sub-task-seconds').text();

    let originalWidth = $(window).width() - $el.children('.sub-task-name').children('.sub-task-loader').offset().left - 10;

    this.countDown = setInterval(function(){
      _this.subTaskTime --
      let newWidth = (_this.subTaskTime / $el.children('.sub-task-name').children('.sub-task-loader').data('sub-task-time')) * originalWidth;
      $el.children('.sub-task-name').children('.sub-task-loader').width(newWidth);

      let time:any = Math.floor(_this.subTaskTime/3600);
      ( time < 10 ) ? time = '0' + time : time;
      $el.children('.sub-task-hours').text(time);
      time =  Math.floor(_this.subTaskTime/60) - time * 60;
      ( time < 10 ) ? time = '0' + time : time;
      $el.children('.sub-task-minutes').text(time);

      time = _this.subTaskTime - Math.floor(_this.subTaskTime/60)*60;
      ( time < 10 ) ? time = '0' + time : time;
      $el.children('.sub-task-seconds').text(time);
      _this.taskTime( $($el.prevAll('.task')[0]), false );

      // task width loader effect
      let fullTime = 0;
      let taskWidth = $(window).width() - $($el.prevAll('.task')[0]).children('.task-name').children('.task-loader').offset().left - 10;
      fullTime += +$($el.prevAll('.task')[0]).children('.task-hours').text() * 60 * 60;
      fullTime += +$($el.prevAll('.task')[0]).children('.task-minutes').text() * 60;
      fullTime += +$($el.prevAll('.task')[0]).children('.task-seconds').text();
      let newTaskWidth = (fullTime / $($el.prevAll('.task')[0]).children('.task-name').children('.task-loader').data('task-time')) * taskWidth;
      $($el.prevAll('.task')[0]).children('.task-name').children('.task-loader').width(newTaskWidth);
      // console.log('fullTime', fullTime, 'dataTime', $($el.prevAll('.task')[0]).children('.task-name').children('.task-loader').data('task-time'))
    }, 1000);
  }

  // change the max width of the loader when the window is rezied
  resetWidth() {
    _.forEach($(document).find('.task-loader'), (loader) => {
      let width = $(window).width() - $(loader).offset().left - 10;
      $(loader).width(width);
    })

    _.forEach($(document).find('.sub-task-loader'), (loader) => {
      let width = $(window).width() - $(loader).offset().left - 10;
      $(loader).width(width);
    })
  }

}
