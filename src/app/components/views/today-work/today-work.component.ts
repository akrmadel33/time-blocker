import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import * as $   from 'jquery';
import * as _   from 'lodash';
import { Howl } from 'howler';

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

  sound = new Howl({
    src: ['../../../../assets/sounds/open-ended.mp3']
  });
  soundTimeInterval: Array<number>; // <-- holds the time intervals that triggers the sound

  constructor(public elements:ElementsService) { }

  ngOnInit() {
    $(document).ready( () => this.headerActions() );

    let checkSubTaskZero = setInterval(() => {
      if(this.subTaskTime <= 0) { clearInterval(this.countDown); this.pauseWhenZero(); }
    }, 500);

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
    });
  }

  headerActions() {
    let _this = this;

    // notifications action
    $('.actions .notification').on('click', function() {
      $(this).hasClass('icon-bell') ? $(this).removeClass('icon-bell').addClass('icon-bell-slash') : $(this).removeClass('icon-bell-slash').addClass('icon-bell');
    });

    // add task action
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
        $(this).removeClass('icon-checkmark').addClass('icon-home');

        // add div.input with its proper value, add subtask plus el.
        let taskName = $(this).next().children('input').val();
        $(this).next().children('input').remove();
        $(this).next().append(_this.elements.divInput);
        $(this).next().children('.input').text(taskName);

        // add task stopwatch
        $(this).parent().append(_this.elements.taskTime);

        // add loader div and assign its proper width
        $(this).next().append(_this.elements.taskLoader);
        let width = $(window).width() - $(this).next().children('.task-loader').offset().left - 10;
        $(this).next().children('.task-loader').width(width);

        // add task mini actions
        $(this).parent().append(_this.elements.taskMiniActions);

        // handler for subtask plus el. click (reference to the plus icon)
        _this.addSubTask( $(this).next().children('.icon-plus') );
        // handler for task mini action
        _this.taskMiniActions( $(this).parent() );

      // open task mini action
      } else {
        // only one mini-task is open
        $(this).parent().prevAll('.task').find('.task-mini-action.open').removeClass('open');
        $(this).parent().nextAll('.task').find('.task-mini-action.open').removeClass('open');
        ( $(this).nextAll('.task-mini-action').hasClass('open') ) ? $(this).nextAll('.task-mini-action').removeClass('open') : $(this).nextAll('.task-mini-action').addClass('open');
      }
    });
  }

  // (reference to the task)
  taskMiniActions($el) {
    let _this = this;

    $el.children('.task-mini-action').on('click', function() {

      if($(this).hasClass('icon-cross')) {
        $(this).parent().nextUntil('.task').addClass('hidden');
        $(this).parent().addClass('hidden');
        setTimeout(() => {
          $(this).parent().nextUntil('.task').remove();
          $(this).parent().remove();
        }, 300);

      } else if($(this).hasClass('icon-eye-slash')) {
        $(this).removeClass('icon-eye-slash').addClass('icon-eye');
        $(this).parent().nextUntil('.task').addClass('hidden');
        setTimeout(() => $(this).parent().nextUntil('.task').fadeOut(100), 300);

      } else if($(this).hasClass('icon-eye')) {
        $(this).removeClass('icon-eye').addClass('icon-eye-slash');
        $(this).parent().nextUntil('.task').fadeIn(100);
        setTimeout(() => $(this).parent().nextUntil('.task').removeClass('hidden'), 100);
      }

    })
  }

  // update task clock (reference to the task, if a new subtask is added or modified)
  taskTime(task, newEl:boolean) {
    let fullTime:number = 0;  // <-- in seconds

    // sum all the time from subtasks
    let subTasksArray = $(task).nextUntil('.task');
    _.forEach(subTasksArray, function(val) {
      if( $(val).children('.sub-task-action').hasClass('icon-cog') ) {
        fullTime += +$(val).children('.sub-task-hours').text() * 60 * 60;
        fullTime += +$(val).children('.sub-task-minutes').text() * 60;
        fullTime += +$(val).children('.sub-task-seconds').text();
      }
    });

    // update task clock
    let time:any = Math.floor(fullTime/3600);
    ( time < 10 ) ? time = '0' + time : time;
    $(task).children('.task-hours').text(time);
    time =  Math.floor(fullTime/60) - time * 60;
    ( time < 10 ) ? time = '0' + time : time;
    $(task).children('.task-minutes').text(time);
    time = fullTime - Math.floor(fullTime/60)*60;
    ( time < 10 ) ? time = '0' + time : time;
    $(task).children('.task-seconds').text(time);

    // update totay's full time
    this.todayTime();

    // change the width and original task time if a new subtask is added or modified
    let width = $(window).width() - $(task).children('.task-name').children('.task-loader').offset().left - 10;
    if(newEl) {
      $(task).children('.task-name').children('.task-loader').data('task-time', fullTime); // set data-task-time
      $(task).children('.task-name').children('.task-loader').width(width); // reset the width

    // else modify the width as % of the original
    } else {
      let fullTime = 0;
      let taskWidth = $(window).width() - $(task).children('.task-name').children('.task-loader').offset().left - 10;
      fullTime += +$(task).children('.task-hours').text() * 60 * 60;
      fullTime += +$(task).children('.task-minutes').text() * 60;
      fullTime += +$(task).children('.task-seconds').text();
      let newTaskWidth = (fullTime / $(task).children('.task-name').children('.task-loader').data('task-time')) * taskWidth;
      $(task).children('.task-name').children('.task-loader').width(newTaskWidth);
    }
  }

  // (reference to the task plus icon)
  addSubTask($el) {
    let _this = this;

    $el.on('click', function() {
      // check if pause first is needed
      if(!$el.hasClass('pause-first')) {

        // new subTask
        if($(this).parents('.task').nextUntil('.task').length == 0) {
          $(this).parents('.task').after(_this.elements.subTask);

        // additional subTask
        } else {
          let subTasks = $(this).parents('.task').nextUntil('.task');
          $(subTasks[subTasks.length-1]).after(_this.elements.subTask);
        }

        _this.subTaskClock( $(this).parents('.task'), true );
        _this.subTaskAction( $(this).parents('.task') );

      }
    });
  }

  // (reference to subtask, if it is a new subtask or a modified one)
  subTaskClock($el, newEl:boolean) {
    let _this = this;

    let el;
    if(newEl) {
      el = $el.nextUntil('.task')[$el.nextUntil('.task').length-1];
    } else {
      el = $el
    }

    $(el).children('.hours-controller').children('button').on('click', function() {
      if($(this).hasClass('icon-chevron-up')) {
        changeTime($(this).parent().prev() , true, true);
      } else {
        changeTime($(this).parent().prev(), false, true);
      }
    });

    $(el).children('.minutes-controller').children('button').on('click', function() {
      if($(this).hasClass('icon-chevron-up')) {
        changeTime($(this).parent().prev() , true, false);
      } else {
        changeTime($(this).parent().prev(), false, false);
      }
    })

    // (reference to the el that contains the time, add or remove, change hour or minute)
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

  // (reference to task)
  subTaskAction($el) {
    let _this = this;

    let el = $el.nextUntil('.task')[$el.nextUntil('.task').length-1];
    $(el).children('.sub-task-action').on('click', function() {
      // approve subTask
      if($(this).hasClass('icon-checkmark')) {
        $(this).removeClass('icon-checkmark').addClass('icon-cog');

        // add div.input with its proper value
        let subtaskName = $(this).next().children('input').val();
        $(this).next().children('input').remove();
        $(this).next().append(_this.elements.subDivInput);
        $(this).next().children('.input').text(subtaskName);

        // remove clock controllers and update taks time
        $(this).nextAll('.hours-controller').remove();
        $(this).nextAll('.minutes-controller').remove();
        _this.taskTime( $(this).parent().prevAll('.task')[0], true );

        // add subtask loader with its proper width
        $(this).next().append(_this.elements.subTaskLoader);
        let width = $(window).width() - $(this).next().children('.sub-task-loader').offset().left - 10;
        $(this).next().children('.sub-task-loader').width(width);
        // set data-sub-task-time
        let time = +$(this).nextAll('.sub-task-hours').text() * 3600 + +$(this).nextAll('.sub-task-minutes').text() * 60 + +$(this).nextAll('.sub-task-seconds').text();
        // (time == 0) ? $(this).next().children('.sub-task-loader').width(0) : false;
        $(this).next().children('.sub-task-loader').data('sub-task-time', time);

        // add subtask miniactions and its handler
        $(this).parent().append(_this.elements.miniActions);
        _this.subTaskMiniActions($(this).parent());

      // modify subTask
      } else {
        // only one mini-subtask is open
        $(this).parent().prevAll('.sub-task').find('.sub-task-mini-action.open').removeClass('open');
        $(this).parent().nextAll('.sub-task').find('.sub-task-mini-action.open').removeClass('open');
        ( $(this).nextAll('.sub-task-mini-action').hasClass('open') ) ? $(this).nextAll('.sub-task-mini-action').removeClass('open') : $(this).nextAll('.sub-task-mini-action').addClass('open')
      }
    });
  }

  // (reference to subtask)
  subTaskMiniActions($el) {
    let _this = this;

    $el.children('.sub-task-mini-action').on('click', function() {

      if( $(this).hasClass('icon-cross') ) {
        let task = $el.prevAll('.task')[0]; // reference to the nearest task
        $el.addClass('hidden');
        setTimeout(() => {
          $el.remove();
          _this.taskTime( task, false );
        }, 300);

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
        // reset the width
        let width = $(window).width() - $el.children('.sub-task-name').children('.sub-task-loader').offset().left - 10;
        $el.children('.sub-task-name').children('.sub-task-loader').width(width);
        // set data-sub-task-time
        let time = +$el.children('.sub-task-hours').text() * 3600 + +$el.children('.sub-task-minutes').text() * 60 + +$el.children('.sub-task-seconds').text();
        (time == 0) ? $el.children('.sub-task-name').children('.sub-task-loader').width(0) : false;
        $el.children('.sub-task-name').children('.sub-task-loader').data('sub-task-time', time);

      } else if( $(this).hasClass('icon-play3') ) {
        // start when all subtasks are approved
        let play:boolean;
        if(
          $(this).parent().prevUntil('.task').find('.icon-checkmark').length == 0 &&
          $(this).parent().nextUntil('.task').find('.icon-checkmark').length == 0
            ) { play = true }

        if(play) {
          // simulate pause-when-zero to deactivate all the icon-pause icons
          _this.pauseWhenZero();

          $(this).removeClass('icon-play3').addClass('icon-pause2');

          // add pause first class
            // to the other to mini actions
          $(this).prevAll('.sub-task-mini-action').addClass('pause-first');
          $(this).nextAll('.sub-task-mini-action').addClass('pause-first');
            // to all subtasks mini actions
          $(this).parent().prevUntil('.task').find('.sub-task-mini-action').addClass('pause-first');
          $(this).parent().nextUntil('.task').find('.sub-task-mini-action').addClass('pause-first');
            // to task's add subtask button
          $($(this).parent().prevAll('.task')[0]).find('.icon-plus').addClass('pause-first');

          _this.countingDown($el);
        }

      } else if( $(this).hasClass('icon-pause2') ) {
        clearInterval(_this.countDown);
        $(this).removeClass('icon-pause2').addClass('icon-play3');

        // remove pause first class
          // to the other to mini actions
        $(this).prevAll('.sub-task-mini-action').removeClass('pause-first');
        $(this).nextAll('.sub-task-mini-action').removeClass('pause-first');
          // to all subtasks mini actions
        $(this).parent().prevUntil('.task').find('.sub-task-mini-action').removeClass('pause-first');
        $(this).parent().nextUntil('.task').find('.sub-task-mini-action').removeClass('pause-first');
          // to task's add subtask button
        $($(this).parent().prevAll('.task')[0]).find('.icon-plus').removeClass('pause-first');
      }

    });

    // subtask to zero, update task, update task loader width, and pause by defual
    $el.children('.sub-task-mini-action').children('.icon-meter2').on('click', function(e) {
      _this.subTaskTime = 0;
      $(this).parent().parent().children('.sub-task-hours').text('00');
      $(this).parent().parent().children('.sub-task-minutes').text('00');
      $(this).parent().parent().children('.sub-task-seconds').text('00');
      $(this).parent().parent().children('.sub-task-name').children('.sub-task-loader').width(0);

      _this.taskTime( $($(this).parent().parent().prevAll('.task')[0]), false );

      // modify task loader width
      let fullTime = 0;
      let taskWidth = $(window).width() - $($(this).parent().parent().prevAll('.task')[0]).children('.task-name').children('.task-loader').offset().left - 10;
      fullTime += +$($(this).parent().parent().prevAll('.task')[0]).children('.task-hours').text() * 60 * 60;
      fullTime += +$($(this).parent().parent().prevAll('.task')[0]).children('.task-minutes').text() * 60;
      fullTime += +$($(this).parent().parent().prevAll('.task')[0]).children('.task-seconds').text();
      let newTaskWidth = (fullTime / $($(this).parent().parent().prevAll('.task')[0]).children('.task-name').children('.task-loader').data('task-time')) * taskWidth;
      $($(this).parent().parent().prevAll('.task')[0]).children('.task-name').children('.task-loader').width(newTaskWidth);
    });
  }

  // (reference to the subtask that will be counting down)
  countingDown($el){
    clearInterval(this.countDown);
    let _this = this;

    // prepare time intervals even when no notification is wanted
    this.createSoundIntervals($el);

    // add total subtask time to the global class variable
    this.subTaskTime = 0;
    this.subTaskTime += +$el.children('.sub-task-hours').text() * 60 * 60;
    this.subTaskTime += +$el.children('.sub-task-minutes').text() * 60;
    this.subTaskTime += +$el.children('.sub-task-seconds').text();

    // prepare to modify the loader width based on 100% width
    let originalWidth = $(window).width() - $el.children('.sub-task-name').children('.sub-task-loader').offset().left - 10;

    this.countDown = setInterval(function(){
      _this.subTaskTime --

      // modify subtask loader width
      let newWidth = (_this.subTaskTime / $el.children('.sub-task-name').children('.sub-task-loader').data('sub-task-time')) * originalWidth;
      $el.children('.sub-task-name').children('.sub-task-loader').width(newWidth);

      // new values for subtask stopwatch
      let time:any = Math.floor(_this.subTaskTime/3600);
      ( time < 10 ) ? time = '0' + time : time;
      $el.children('.sub-task-hours').text(time);
      time =  Math.floor(_this.subTaskTime/60) - time * 60;
      ( time < 10 ) ? time = '0' + time : time;
      $el.children('.sub-task-minutes').text(time);

      // get seconds value and update it for bot subtask and task's total time
      time = _this.subTaskTime - Math.floor(_this.subTaskTime/60)*60;
      ( time < 10 ) ? time = '0' + time : time;
      $el.children('.sub-task-seconds').text(time);
      _this.taskTime( $($el.prevAll('.task')[0]), false );

      // play notification sound and its functions when notifications are wanted
      if($('.actions .notification').hasClass('icon-bell')) _this.playNotification($el);
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
      let time = +$(loader).parents('.sub-task').children('.sub-task-hours').text() * 3600 + +$(loader).parents('.sub-task').children('.sub-task-minutes').text() * 60 + +$(loader).parents('.sub-task').children('.sub-task-seconds').text();

      (time == 0) ? $(loader).width(0) : $(loader).width(width);
    })
  }

  pauseWhenZero() {
    $('.work-container').children('.sub-task').find('.icon-pause2').removeClass('icon-pause2').addClass('icon-play3');
    $('.work-container').children('.task').find('.pause-first').removeClass('pause-first');
    $('.work-container').children('.sub-task').find('.pause-first').removeClass('pause-first');
  }

  todayTime() {
    let fullTime:number = 0;  // <-- in seconds

    let subTasksArray = $('.work-container').children('.task');
    _.forEach(subTasksArray, function(val) {
      fullTime += +$(val).children('.task-hours').text() * 60 * 60;
      fullTime += +$(val).children('.task-minutes').text() * 60;
      fullTime += +$(val).children('.task-seconds').text();
    });

    // update task clock
    let time:any = Math.floor(fullTime/3600);
    ( time < 10 ) ? time = '0' + time : time;
    $('.header .title').children('.today-hour').text(time);
    time =  Math.floor(fullTime/60) - time * 60;
    ( time < 10 ) ? time = '0' + time : time;
    $('.header .title').children('.today-minute').text(time);

  }

  // (reference to subtask that is counting down)
  createSoundIntervals($el) {
    // subtask data time in seconds
    let fullTime = $el.children('.sub-task-name').children('.sub-task-loader').data('sub-task-time');

    this.soundTimeInterval = [0];
    while (fullTime >= 2400) {
      fullTime = fullTime - 1500;
      this.soundTimeInterval.push(fullTime);
    }
  }

  // (reference to subtask that is counting down)
  playNotification($el) {
    _.forEach(this.soundTimeInterval, (time) => {
      if(time == this.subTaskTime) {

        this.sound.play();

        clearInterval(this.countDown);
        this.pauseWhenZero();

      }
    })
  }

}
