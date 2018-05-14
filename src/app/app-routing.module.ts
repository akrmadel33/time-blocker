import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TodayWorkComponent } from './components/views/today-work/today-work.component';

const routes: Routes = [
  {path: 'today-work', component:TodayWorkComponent},
  {path: '', redirectTo:'/today-work', pathMatch:'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
