// -- copyright
// OpenProject is an open source project management software.
// Copyright (C) 2012-2021 the OpenProject GmbH
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See COPYRIGHT and LICENSE files for more details.
//++

import {
  Component,
  ElementRef,
  EventEmitter,
  Injector,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HalResourceService } from 'core-app/features/hal/services/hal-resource.service';
import { PathHelperService } from 'core-app/core/path-helper/path-helper.service';
import { I18nService } from 'core-app/core/i18n/i18n.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentProjectService } from 'core-app/core/current-project/current-project.service';
import { HalResourceNotificationService } from 'core-app/features/hal/services/hal-resource-notification.service';
import { HalResource } from 'core-app/features/hal/resources/hal-resource';
import { ApiV3FilterBuilder } from 'core-app/shared/helpers/api-v3/api-v3-filter-builder';
import { APIV3Service } from 'core-app/core/apiv3/api-v3.service';

@Component({
  templateUrl: './add-assignee.component.html',
  selector: 'op-tp-add-assignee',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAssigneeComponent {
  @Output() public selectAssignee = new EventEmitter<HalResource>();

  @Input() alreadySelected:string[] = [];

  public getOptionsFn = (query:string):Observable<unknown[]> => this.autocomplete(query);

  constructor(
    protected elementRef:ElementRef,
    protected halResourceService:HalResourceService,
    protected I18n:I18nService,
    protected halNotification:HalResourceNotificationService,
    readonly pathHelper:PathHelperService,
    readonly apiV3Service:APIV3Service,
    readonly injector:Injector,
    readonly currentProjectService:CurrentProjectService,
  ) { }

  public autocomplete(term:string|null):Observable<HalResource[]> {
    const filters = new ApiV3FilterBuilder();

    filters.add('member', '=', [this.currentProjectService.id || '']);

    if (term) {
      filters.add('name_and_identifier', '~', [term]);
    }

    return this
      .apiV3Service
      .principals
      .filtered(filters)
      .get()
      .pipe(
        map((collection) => collection.elements.filter(
          (user) => !this.alreadySelected.find((selected) => selected === user.id),
        )),
      );
  }

  public selectUser(user:HalResource):void {
    this.selectAssignee.emit(user);
  }
}
