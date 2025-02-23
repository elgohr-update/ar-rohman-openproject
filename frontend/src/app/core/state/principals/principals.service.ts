import { Injectable } from '@angular/core';
import {
  catchError,
  tap,
} from 'rxjs/operators';
import { Observable } from 'rxjs';
import {
  applyTransaction,
  ID,
} from '@datorama/akita';
import { APIV3Service } from 'core-app/core/apiv3/api-v3.service';
import { ToastService } from 'core-app/shared/components/toaster/toast.service';
import { IHALCollection } from 'core-app/core/apiv3/types/hal-collection.type';
import { HttpClient } from '@angular/common/http';
import { PrincipalsQuery } from 'core-app/core/state/principals/principals.query';
import { Apiv3ListParameters } from 'core-app/core/apiv3/paths/apiv3-list-resource.interface';
import { collectionKey } from 'core-app/core/state/collection-store';
import {
  EffectHandler,
} from 'core-app/core/state/effects/effect-handler.decorator';
import { ActionsService } from 'core-app/core/state/actions/actions.service';
import { PrincipalsStore } from './principals.store';
import { Principal } from './principal.model';

@EffectHandler
@Injectable()
export class PrincipalsResourceService {
  protected store = new PrincipalsStore();

  readonly query = new PrincipalsQuery(this.store);

  private get principalsPath():string {
    return this
      .apiV3Service
      .principals
      .path;
  }

  constructor(
    readonly actions$:ActionsService,
    private http:HttpClient,
    private apiV3Service:APIV3Service,
    private toastService:ToastService,
  ) {
  }

  fetchPrincipals(params:Apiv3ListParameters):Observable<IHALCollection<Principal>> {
    const collectionURL = collectionKey(params);

    return this
      .http
      .get<IHALCollection<Principal>>(this.principalsPath + collectionURL)
      .pipe(
        tap((events) => {
          applyTransaction(() => {
            this.store.add(events._embedded.elements);
            this.store.update(({ collections }) => (
              {
                collections: {
                  ...collections,
                  [collectionURL]: {
                    ...collections[collectionURL],
                    ids: events._embedded.elements.map((el) => el.id),
                  },
                },
              }
            ));
          });
        }),
        catchError((error) => {
          this.toastService.addError(error);
          throw error;
        }),
      );
  }

  update(id:ID, principal:Partial<Principal>):void {
    this.store.update(id, principal);
  }

  modifyCollection(params:Apiv3ListParameters, callback:(collection:ID[]) => ID[]):void {
    const key = collectionKey(params);
    this.store.update(({ collections }) => (
      {
        collections: {
          ...collections,
          [key]: {
            ...collections[key],
            ids: [...callback(collections[key]?.ids || [])],
          },
        },
      }
    ));
  }

  removeFromCollection(params:Apiv3ListParameters, ids:ID[]):void {
    const key = collectionKey(params);
    this.store.update(({ collections }) => (
      {
        collections: {
          ...collections,
          [key]: {
            ...collections[key],
            ids: (collections[key]?.ids || []).filter((id) => !ids.includes(id)),
          },
        },
      }
    ));
  }
}
