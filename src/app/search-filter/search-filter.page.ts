import {Component, Inject, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Location, TitleCasePipe} from '@angular/common';
import {ModalController} from '@ionic/angular';
import {FormGroup} from '@angular/forms';
import {ContentService, ContentSearchCriteria, ContentSearchResult, SearchType} from 'sunbird-sdk';
import {FilterFormConfigMapper} from '@app/app/search-filter/filter-form-config-mapper';
import {CommonUtilService} from '@app/services';
import {Subscription} from 'rxjs';
import {FieldConfig} from 'common-form-elements';

@Component({
    selector: 'app-search-filter.page',
    templateUrl: './search-filter.page.html',
    styleUrls: ['./search-filter.page.scss'],
    providers: [FilterFormConfigMapper, TitleCasePipe]
})
export class SearchFilterPage implements OnInit {
    @Input('initialFilterCriteria') readonly initialFilterCriteria: ContentSearchCriteria;
    @Input('defaultFilterCriteria') readonly defaultFilterCriteria: ContentSearchCriteria;

    public config: FieldConfig<any>[];

    private formGroup: FormGroup;
    private formValueSubscription: Subscription;
    private appliedFilterCriteria: ContentSearchCriteria;

    constructor(
        @Inject('CONTENT_SERVICE') private contentService: ContentService,
        private router: Router,
        private location: Location,
        private modalController: ModalController,
        private commonUtilService: CommonUtilService,
        private filterFormConfigMapper: FilterFormConfigMapper
    ) {
    }

    ngOnInit() {
        this.resetFilter(false);
    }

    resetFilter(isDefaultFilterSelected: boolean) {
        if (isDefaultFilterSelected) {
            this.appliedFilterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
        } else {
            this.appliedFilterCriteria = JSON.parse(JSON.stringify(this.initialFilterCriteria));
        }
        this.config = this.buildConfig(this.appliedFilterCriteria);
    }

    applyFilter() {
        this.modalController.dismiss({
            appliedFilterCriteria: this.appliedFilterCriteria
        });
    }

    cancel() {
        this.modalController.dismiss();
    }

    private async refreshForm(formValue) {
        const searchCriteria: ContentSearchCriteria = {
            ...JSON.parse(JSON.stringify(this.appliedFilterCriteria)),
            limit: 0,
            mode: 'hard',
            searchType: SearchType.FILTER,
            fields: [],
        };

        searchCriteria.facetFilters.forEach((facetFilter) => {
            const selection = formValue[facetFilter.name];

            facetFilter.values.forEach(f => {
                f.apply = (selection && (selection.indexOf(f.name) === -1)) ? false : true;
            });

        });

        const loader = await this.commonUtilService.getLoader();
        await loader.present();

        try {
            const contentSearchResult: ContentSearchResult = await this.contentService.searchContent(searchCriteria).toPromise();
            this.appliedFilterCriteria = contentSearchResult.filterCriteria;
            this.config = this.buildConfig(contentSearchResult.filterCriteria, formValue);
        } catch (e) {
            // todo show error toast
            console.error(e);
        } finally {
            await loader.dismiss();
        }
    }

    private buildConfig(filterCriteria: ContentSearchCriteria, defaults?: {[field: string]: any}) {
        return this.filterFormConfigMapper.map(
            filterCriteria.facetFilters.reduce((acc, f) => {
                acc[f.name] = f.values;
                return acc;
            }, {})
        );
    }

    valueChanged(event) {
        if (!event) {
            return;
        }
        this.refreshForm(event);
    }
}
