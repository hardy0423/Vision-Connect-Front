import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ComponentMaterialModule } from "./material-module";
import { AngularToastifyModule } from 'angular-toastify'; 
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ComponentMaterialModule,
    TranslateModule,
    AngularToastifyModule,
  ],
  exports: [
    CommonModule,
    ComponentMaterialModule,
    ReactiveFormsModule,
    FormsModule,
    AngularToastifyModule,
    TranslateModule,
  ],
})


export class SharedModule {
  constructor(private translate: TranslateService) {
    translate.addLangs(["fr"]);
    translate.setDefaultLang("fr");
    translate.use("fr");
  }
}

