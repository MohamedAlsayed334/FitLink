import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { ChatComponent } from './chat/chat.component';

const routes: Routes = [{ path: '', component: ChatComponent }];

@NgModule({
  declarations: [ChatComponent],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)],
  exports: [ChatComponent],
})
export class ChatModule {}