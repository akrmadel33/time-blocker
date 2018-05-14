import { Injectable } from '@angular/core';

@Injectable()
export class ElementsService {

  constructor() { }

  task = `<div class="task">
            <span class="task-action icon-checkmark"></span>

            <div class="task-name">
              <input type="text" placeholder="Task Name">
            </div>
          </div> `;


  divInput = `<span class="icon-plus"></span>
              <div class="input">Task Name</div>`;


  taskTime = `<div class="task-hours">00</div>
              <div class="time-spacer">:</div>
              <div class="task-minutes">00</div>
              <div class="time-spacer">:</div>
              <div class="task-seconds">00</div>`;


  taskLoader = `<div class="task-loader" style="width:0px"></div>`;


  subTask = ` <div class="sub-task">
                <span class="sub-task-action icon-checkmark"></span>

                <div class="sub-task-name">
                  <input type="text" placeholder="Sub Task Name">
                </div>

                <div class="sub-task-hours">00</div>
                <div class="hours-controller">
                  <span class="icon-chevron-up"></span>
                  <span class="icon-chevron-down"></span>
                </div>

                <div class="sub-time-spacer">:</div>

                <div class="sub-task-minutes">00</div>
                <div class="minutes-controller">
                  <span class="icon-chevron-up"></span>
                  <span class="icon-chevron-down"></span>
                </div>

                <div class="sub-time-spacer">:</div>
                <div class="sub-task-seconds">00</div>
              </div>`;


  subDivInput = `<div class="input">Sub Task Name</div>`;


  subTaskLoader = `<div class="sub-task-loader" style="width:0px"></div>`;


  miniActions = ` <span class="sub-task-mini-action icon-cross"></span>
                  <span class="sub-task-mini-action icon-play3"></span>
                  <span class="sub-task-mini-action icon-pencil"></span>`;


  subHourController = ` <div class="hours-controller">
                          <span class="icon-chevron-up"></span>
                          <span class="icon-chevron-down"></span>
                        </div>`;


  subMinuteController = ` <div class="minutes-controller">
                            <span class="icon-chevron-up"></span>
                            <span class="icon-chevron-down"></span>
                          </div>`;

}
