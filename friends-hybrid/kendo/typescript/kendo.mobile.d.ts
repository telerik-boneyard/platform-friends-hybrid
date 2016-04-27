// type definitions for Kendo UI

declare module kendo {
    function culture(): {
        name: string;
        calendar: {
            AM: string[];
            PM: string[];
            days: {
                names: string[];
                namesAbbr: string[];
                namesShort: string[];
                firstDay: number;
            };
            months: {
                names: string[];
                namesAbbr: string[];
            };
            patterns: {
                D: string;
                F: string;
                G: string;
                M: string;
                T: string;
                Y: string;
                d: string;
                g: string;
                m: string;
                s: string;
                t: string;
                u: string;
                y: string;
            };
            twoDigitYearMax: number;
        };
        calendars: {
            standard: {
                AM: string[];
                PM: string[];
                days: {
                    names: string[];
                    namesAbbr: string[];
                    namesShort: string[];
                    firstDay: number;
                };
                months: {
                    names: string[];
                    namesAbbr: string[];
                };
                patterns: {
                    D: string;
                    F: string;
                    G: string;
                    M: string;
                    T: string;
                    Y: string;
                    d: string;
                    g: string;
                    m: string;
                    s: string;
                    t: string;
                    u: string;
                    y: string;
                };
                twoDigitYearMax: number;
            };
        };
        numberFormat: {
            currency: {
                decimals: number;
                groupSize: number[];
                pattern: string[];
                symbol: string;
            };
            decimals: number;
            groupSize: number[];
            pattern: string[];
            percent: {
                decimals: number;
                groupSize: number[];
                pattern: string[];
                symbol: string;
            };
        };
    };

    var cultures: {[culture: string] : {
        name?: string;
        calendar?: {
            AM: string[];
            PM: string[];
            days: {
                names: string[];
                namesAbbr: string[];
                namesShort: string[];
                firstDay: number;
            };
            months: {
                names: string[];
                namesAbbr: string[];
            };
            patterns: {
                D: string;
                F: string;
                G: string;
                M: string;
                T: string;
                Y: string;
                d: string;
                g: string;
                m: string;
                s: string;
                t: string;
                u: string;
                y: string;
            };
            twoDigitYearMax: number;
        };
        calendars?: {
            standard: {
                AM: string[];
                PM: string[];
                days: {
                    names: string[];
                    namesAbbr: string[];
                    namesShort: string[];
                    firstDay: number;
                };
                months: {
                    names: string[];
                    namesAbbr: string[];
                };
                patterns: {
                    D: string;
                    F: string;
                    G: string;
                    M: string;
                    T: string;
                    Y: string;
                    d: string;
                    g: string;
                    m: string;
                    s: string;
                    t: string;
                    u: string;
                    y: string;
                };
                twoDigitYearMax: number;
            };
        };
        numberFormat?: {
            currency: {
                decimals: number;
                groupSize: number[];
                pattern: string[];
                symbol: string;
            };
            decimals: number;
            groupSize: number[];
            pattern: string[];
            percent: {
                decimals: number;
                groupSize: number[];
                pattern: string[];
                symbol: string;
            };
        };
    }};

    function format(format: string, ...values: any[]): string;

    function fx(selector: string): effects.Element;
    function fx(element: Element): effects.Element;
    function fx(element: JQuery): effects.Element;

    function init(selector: string, ...namespaces: any[]): void;
    function init(element: JQuery, ...namespaces: any[]): void;
    function init(element: Element, ...namespaces: any[]): void;

    function observable(data: any): kendo.data.ObservableObject;
    function observableHierarchy(array: any[]): kendo.data.ObservableArray;

    function render(template: (data: any) => string, data: any[]): string;
    function template(template: string, options?: TemplateOptions): (data: any) => string;

    function guid(): string;

    function widgetInstance(element: JQuery, suite: typeof kendo.ui): kendo.ui.Widget;
    function widgetInstance(element: JQuery, suite: typeof kendo.mobile.ui): kendo.ui.Widget;


    var ns: string;

    var keys: {
        INSERT: number;
        DELETE: number;
        BACKSPACE: number;
        TAB: number;
        ENTER: number;
        ESC: number;
        LEFT: number;
        UP: number;
        RIGHT: number;
        DOWN: number;
        END: number;
        HOME: number;
        SPACEBAR: number;
        PAGEUP: number;
        PAGEDOWN: number;
        F2: number;
        F10: number;
        F12: number;
    };

    var support: {
        touch: boolean;
        pointers: boolean;
        scrollbar(): number;
        hasHW3D: boolean;
        hasNativeScrolling: boolean;
        devicePixelRatio: number;
        placeHolder: boolean;
        zoomLevel: number;
        mobileOS: {
            device: string;
            tablet: any;
            browser: string;
            name: string;
            majorVersion: string;
            minorVersion: string;
            flatVersion: number;
            appMode: boolean;
        };
        browser: {
            msie: boolean;
            webkit: boolean;
            safari: boolean;
            opera: boolean;
            version: string;
        };
    };

    var version: string;

    interface TemplateOptions {
        paramName?: string;
        useWithBlock?: boolean;
    }

    class Class {
        static fn: Class;
        static extend(prototype: Object): Class;
    }

    class Observable extends Class {
        static fn: Observable;
        static extend(prototype: Object): Observable;

        bind(eventName: string, handler: Function): Observable;
        one(eventName: string, handler: Function): Observable;
        trigger(eventName: string, e?: any): boolean;
        unbind(eventName: string, handler?: any): Observable;
    }

    interface ViewOptions {
        tagName?: string;
        wrap?: boolean;
        model?: Object;
        evalTemplate?: boolean;
        init?: (e: ViewEvent) => void;
        show?: (e: ViewEvent) => void;
        hide?: (e: ViewEvent) => void;
    }

    interface ViewEvent {
        sender: View;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    class View extends Observable {
        constructor(element: Element, options?: ViewOptions);
        constructor(element: string, options?: ViewOptions);
        element: JQuery;
        content: any;
        tagName: string;
        model: Object;
        init(element: Element, options?: ViewOptions): void;
        init(element: string, options?: ViewOptions): void;
        render(container?: any): JQuery;
        destroy(): void;
    }

    class ViewContainer extends Observable {
       view: View;
    }

    class Layout extends View {
        containers: { [selector: string]: ViewContainer; };
        showIn(selector: string, view: View, transitionClass?: string): void;
    }

    class History extends Observable {
        current: string;
        root: string;
        start(options: Object): void;
        stop(): void;
        change(callback: Function): void;
        navigate(location: string, silent?: boolean): void;
    }

    var history: History;

    interface RouterOptions {
        init?: (e: RouterEvent) => void;
        pushState?: boolean;
        hashBang?: boolean;
        root?: string;
        ignoreCase?: boolean;
        change?(e: RouterChangeEvent): void;
        routeMissing?(e: RouterRouteMissingEvent): void;
        same?(e: RouterEvent): void;
    }

    interface RouterEvent {
        sender: Router;
        url: string;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface RouterChangeEvent extends RouterEvent {
        params: any;
        backButtonPressed: boolean;
    }

    interface RouterRouteMissingEvent extends RouterEvent {
        params: any;
    }

    class Route extends Class {
        route: RegExp;
        callback(url: string): void;
        worksWith(url: string): void;
    }

    class Router extends Observable {
        constructor(options?: RouterOptions);
        routes: Route[];
        init(options?: RouterOptions): void;
        start(): void;
        destroy(): void;
        route(route: string, callback: Function): void;
        navigate(location: string, silent?: boolean): void;
        replace(location: string, silent?: boolean): void;
    }

}

declare module kendo.effects {
    function enable(): void;
    function disable(): void;

    interface Element {
        expand(direction: string): effects.Expand;
        expandHorizontal(): effects.Expand;
        expandVertical(): effects.Expand;
        fade(direction: string): effects.Fade;
        fadeIn(): effects.Fade;
        fadeOut(): effects.Fade;
        flip(axis: string, face: JQuery, back: JQuery): effects.Flip;
        flipHorizontal(face: JQuery, back: JQuery): effects.Flip;
        flipVertical(face: JQuery, back: JQuery): effects.Flip;
        pageturn(axis: string, face: JQuery, back: JQuery): effects.PageTurn;
        pageturnHorizontal(face: JQuery, back: JQuery): effects.PageTurn;
        pageturnVertical(face: JQuery, back: JQuery): effects.PageTurn;
        slideIn(direction: string): effects.SlideIn;
        slideInDown(): effects.SlideIn;
        slideInLeft(): effects.SlideIn;
        slideInRight(): effects.SlideIn;
        slideInUp(): effects.SlideIn;
        tile(direction: string, previous: JQuery): effects.Tile;
        tileDown(previous: JQuery): effects.Tile;
        tileLeft(previous: JQuery): effects.Tile;
        tileRight(previous: JQuery): effects.Tile;
        tileUp(previous: JQuery): effects.Tile;
        transfer(target: JQuery): effects.Transfer;
        zoom(direction: string): effects.Zoom;
        zoomIn(): effects.Zoom;
        zoomOut(): effects.Zoom;
    }

    interface Effect {
        play(): JQueryPromise<any>;
        reverse(): JQueryPromise<any>;
        duration(value: number): Effect;
        add(effect: Effect): Effect;
        stop(): Effect;
    }

    interface Expand extends Effect {
        duration(value: number): Expand;
        direction(value: string): Expand;
        stop(): Expand;
        add(effect: Effect): Expand;
    }

    interface Fade extends Effect {
        duration(value: number): Fade;
        direction(value: string): Fade;
        stop(): Fade;
        add(effect: Effect): Fade;
        startValue(value: number): Fade;
        endValue(value: number): Fade;
    }

    interface Flip extends Effect {
        duration(value: number): Flip;
        direction(value: string): Flip;
        stop(): Flip;
        add(effect: Effect): Flip;
    }

    interface PageTurn extends Effect {
        duration(value: number): PageTurn;
        direction(value: string): PageTurn;
        stop(): PageTurn;
        add(effect: Effect): PageTurn;
    }

    interface SlideIn extends Effect {
        duration(value: number): SlideIn;
        direction(value: string): SlideIn;
        stop(): SlideIn;
        add(effect: Effect): SlideIn;
    }

    interface Tile extends Effect {
        duration(value: number): Tile;
        direction(value: string): Tile;
        stop(): Tile;
        add(effect: Effect): Tile;
    }

    interface Transfer extends Effect {
        duration(value: number): Transfer;
        stop(): Transfer;
        add(effect: Effect): Transfer;
    }

    interface Zoom extends Effect {
        duration(value: number): Zoom;
        direction(value: string): Zoom;
        stop(): Zoom;
        add(effect: Effect): Zoom;
        startValue(value: number): Zoom;
        endValue(value: number): Zoom;
    }
}

declare module kendo.data {
    interface ObservableObjectEvent {
        sender?: ObservableObject;
        field?: string;
    }

    interface ObservableObjectSetEvent extends ObservableObjectEvent {
        value?: any;
        preventDefault?: Function;
    }


    class Binding extends Observable {
        source: any;
        parents: any[];
        path: string;
        observable: boolean;
        dependencies: { [path: string]: boolean; };
        constructor(parents: any[], path: string);
        change(e: Object): void;
        start(source: kendo.Observable): void;
        stop(source: kendo.Observable): void;
        get (): any;
        set (value: any): void;
        destroy(): void;
    }

    class BindingTarget {
        target: any;
        options: any;
        source: any;
    }

    class EventBinding extends Binding {
        get (): void;
    }

    class TemplateBinding extends Binding {
        constructor(source: kendo.Observable, path: string, template: Function);
        render(value: Object): string;
    }

    module binders { }

    interface Bindings {
        [key: string]: Binding;
    }

    class Binder extends Class {
        static fn: Binder;
        element: any;
        bindings: Bindings;
        options: BinderOptions;
        constructor(element: any, bindings: Bindings, options?: BinderOptions);
        static extend(prototype: Object): Binder;
        init(element: any, bindings: Bindings, options?: BinderOptions): void;
        bind(binding: Binding, attribute: string): void;
        destroy(): void;
        refresh(): void;
        refresh(attribute: string): void;
    }

    interface BinderOptions {
    }

    class ObservableObject extends Observable{
        constructor(value?: any);
        uid: string;
        init(value?: any): void;
        get(name: string): any;
        parent(): ObservableObject;
        set(name: string, value: any): void;
        toJSON(): Object;
    }

    class Model extends ObservableObject {
        static idField: string;
        static fields: DataSourceSchemaModelFields;

        idField: string;
        _defaultId: any;
        fields: DataSourceSchemaModelFields;
        defaults: {
            [field: string]: any;
        };
        id: any;
        dirty: boolean;

        static define(options: DataSourceSchemaModelWithFieldsObject): typeof Model;
        static define(options: DataSourceSchemaModelWithFieldsArray): typeof Model;

        constructor(data?: any);
        init(data?: any): void;
        accept(data?: any): void;
        editable(field: string): boolean;
        isNew(): boolean;
    }

    interface SchedulerEventData {
        description?: string;
        end?: Date;
        endTimezone?: string;
        isAllDay?: boolean;
        id?: any;
        start?: Date;
        startTimezone?: string;
        recurrenceId?: any;
        recurrenceRule?: string;
        recurrenceException?: string;
        title?: string;
    }

    class SchedulerEvent extends Model {
        static idField: string;
        static fields: DataSourceSchemaModelFields;

        constructor(data?: SchedulerEventData);

        description: string;
        end: Date;
        endTimezone: string;
        isAllDay: boolean;
        id: any;
        start: Date;
        startTimezone: string;
        recurrenceId: any;
        recurrenceRule: string;
        recurrenceException: string;
        title: string;

        static define(options: DataSourceSchemaModelWithFieldsObject): typeof SchedulerEvent;
        static define(options: DataSourceSchemaModelWithFieldsArray): typeof SchedulerEvent;

        init(data?: SchedulerEventData): void;
        clone(options: any, updateUid: boolean): SchedulerEvent;
        duration(): number;
        expand(start: Date, end: Date, zone: any): SchedulerEvent[];
        update(eventInfo: SchedulerEventData): void;
        isMultiDay(): boolean;
        isException(): boolean;
        isOccurrence(): boolean;
        isRecurring(): boolean;
        isRecurrenceHead(): boolean;
        toOccurrence(options: any): SchedulerEvent;
    }

    class TreeListModel extends Model {
        static idField: string;
        static fields: DataSourceSchemaModelFields;

        id: any;
        parentId: any;

        static define(options: DataSourceSchemaModelWithFieldsObject): typeof TreeListModel;
        static define(options: DataSourceSchemaModelWithFieldsArray): typeof TreeListModel;

        constructor(data?: any);
        init(data?: any): void;
        loaded(value: boolean): void;
        loaded(): boolean;
    }

    class TreeListDataSource extends DataSource {
        load(model: kendo.data.TreeListModel): JQueryPromise<any>;
        childNodes(model: kendo.data.TreeListModel): kendo.data.TreeListModel[];
        rootNodes(): kendo.data.TreeListModel[];
        parentNode(model: kendo.data.TreeListModel): kendo.data.TreeListModel;
        level(model: kendo.data.TreeListModel): number;
        level(model: any): number;

        add(model: Object): kendo.data.TreeListModel;
        add(model: kendo.data.TreeListModel): kendo.data.TreeListModel;
        at(index: number): kendo.data.TreeListModel;
        cancelChanges(model?: kendo.data.TreeListModel): void;
        get(id: any): kendo.data.TreeListModel;
        getByUid(uid: string): kendo.data.TreeListModel;
        indexOf(value: kendo.data.TreeListModel): number;
        insert(index: number, model: kendo.data.TreeListModel): kendo.data.TreeListModel;
        insert(index: number, model: Object): kendo.data.TreeListModel;
        remove(model: kendo.data.TreeListModel): void;
    }

    class GanttTask extends Model {
        static idField: string;
        static fields: DataSourceSchemaModelFields;

        id: any;
        parentId: number;
        orderId: number;
        title: string;
        start: Date;
        end: Date;
        percentComplete: number;
        summary: boolean;
        expanded: boolean;

        static define(options: DataSourceSchemaModelWithFieldsObject): typeof GanttTask;
        static define(options: DataSourceSchemaModelWithFieldsArray): typeof GanttTask;

        constructor(data?: any);
        init(data?: any): void;
    }

    class GanttDependency extends Model {
        static idField: string;
        static fields: DataSourceSchemaModelFields;

        id: any;
        predecessorId: number;
        successorId: number;
        type: number;

        static define(options: DataSourceSchemaModelWithFieldsObject): typeof GanttDependency;
        static define(options: DataSourceSchemaModelWithFieldsArray): typeof GanttDependency;

        constructor(data?: any);
        init(data?: any): void;
    }

    class Node extends Model {
        children: HierarchicalDataSource;

        append(model: any): void;
        level(): number;
        load(id: any): void;
        loaded(value: boolean): void;
        loaded(): boolean;
        parentNode(): Node;
    }

    class SchedulerDataSource extends DataSource {
        add(model: Object): kendo.data.SchedulerEvent;
        add(model: kendo.data.SchedulerEvent): kendo.data.SchedulerEvent;
        at(index: number): kendo.data.SchedulerEvent;
        cancelChanges(model?: kendo.data.SchedulerEvent): void;
        get(id: any): kendo.data.SchedulerEvent;
        getByUid(uid: string): kendo.data.SchedulerEvent;
        indexOf(value: kendo.data.SchedulerEvent): number;
        insert(index: number, model: kendo.data.SchedulerEvent): kendo.data.SchedulerEvent;
        insert(index: number, model: Object): kendo.data.SchedulerEvent;
        remove(model: kendo.data.SchedulerEvent): void;
    }

    class GanttDataSource extends DataSource {
        add(model: Object): kendo.data.GanttTask;
        add(model: kendo.data.GanttTask): kendo.data.GanttTask;
        at(index: number): kendo.data.GanttTask;
        cancelChanges(model?: kendo.data.GanttTask): void;
        get(id: any): kendo.data.GanttTask;
        getByUid(uid: string): kendo.data.GanttTask;
        indexOf(value: kendo.data.GanttTask): number;
        insert(index: number, model: Object): kendo.data.GanttTask;
        insert(index: number, model: kendo.data.GanttTask): kendo.data.GanttTask;
        remove(model: kendo.data.GanttTask): void;
    }

    class GanttDependencyDataSource extends DataSource {
        add(model: Object): kendo.data.GanttDependency;
        add(model: kendo.data.GanttDependency): kendo.data.GanttDependency;
        at(index: number): kendo.data.GanttDependency;
        cancelChanges(model?: kendo.data.GanttDependency): void;
        get(id: any): kendo.data.GanttDependency;
        getByUid(uid: string): kendo.data.GanttDependency;
        indexOf(value: kendo.data.GanttDependency): number;
        insert(index: number, model: Object): kendo.data.GanttDependency;
        insert(index: number, model: kendo.data.GanttDependency): kendo.data.GanttDependency;
        remove(model: kendo.data.GanttDependency): void;
    }

    class HierarchicalDataSource extends DataSource {
        constructor(options?: HierarchicalDataSourceOptions);
        init(options?: HierarchicalDataSourceOptions): void;
    }

    interface HierarchicalDataSourceOptions extends DataSourceOptions {
        schema?: HierarchicalDataSourceSchema;
    }


    interface HierarchicalDataSourceSchema extends DataSourceSchemaWithOptionsModel {
        model?: HierarchicalDataSourceSchemaModel;
    }

    interface HierarchicalDataSourceSchemaModel extends DataSourceSchemaModel {
        hasChildren?: any;
        children?: any;
    }

    interface PivotDiscoverRequestRestrictionOptions {
        catalogName: string;
        cubeName: string;
    }

    interface PivotDiscoverRequestDataOptions {
        command: string;
        restrictions: PivotDiscoverRequestRestrictionOptions;
    }

    interface PivotDiscoverRequestOptions {
        data: PivotDiscoverRequestDataOptions;
    }

    interface PivotTransportConnection {
        catalog?: string;
        cube?: string;
    }

    interface PivotTransportDiscover {
        cache?: boolean;
        contentType?: string;
        data?: any;
        dataType?: string;
        type?: string;
        url?: any;
    }

    interface PivotTransport {
        discover?: any;
        read?: any;
    }

    interface PivotTransportWithObjectOperations extends PivotTransport {
        connection: PivotTransportConnection;
        discover?: PivotTransportDiscover;
        read?: DataSourceTransportRead;
    }

    interface PivotTransportWithFunctionOperations extends PivotTransport {
        discover?: (options: DataSourceTransportOptions) => void;
        read?: (options: DataSourceTransportOptions) => void;
    }

    interface PivotDataSourceAxisOptions {
        name: string;
        expand?: boolean;
    }

    interface PivotDataSourceMeasureOptions {
        values: string[];
        axis?: string;
    }

    interface PivotDataSourceOptions extends DataSourceOptions {
        columns?: PivotDataSourceAxisOptions[];
        measures?: PivotDataSourceMeasureOptions[];
        rows?: PivotDataSourceAxisOptions[];
        transport?: PivotTransport;
        schema?: PivotSchema;
    }

    interface PivotTupleModel {
        children: PivotTupleModel[];
        caption?: string;
        name: string;
        levelName?: string;
        levelNum: number;
        hasChildren?: boolean;
        hierarchy?: string;
    }

    interface PivotSchemaRowAxis {
        tuples: PivotTupleModel[];
    }

    interface PivotSchemaColumnAxis {
        tuples: PivotTupleModel[];
    }

    interface PivotSchemaAxes {
        rows: PivotSchemaRowAxis;
        columns: PivotSchemaColumnAxis;
    }

    interface PivotSchema extends DataSourceSchema{
        axes?: any;
        catalogs?: any;
        cubes?: any;
        data?: any;
        dimensions?: any;
        hierarchies?: any;
        levels?: any;
        measures?: any;
    }

    class PivotDataSource extends DataSource {
        axes(): PivotSchemaAxes;
        constructor(options?: PivotDataSourceOptions);
        init(options?: PivotDataSourceOptions): void;
        catalog(val: string): void;
        columns(val: string[]): string[];
        cube(val: string): void;
        discover(options: PivotDiscoverRequestOptions): JQueryPromise<any>;
        measures(val: string[]): string[];
        measuresAxis(): string;
        rows(val: string[]): string[];
        schemaCatalogs(): JQueryPromise<any>;
        schemaCubes(): JQueryPromise<any>;
        schemaDimensions(): JQueryPromise<any>;
        schemaHierarchies(): JQueryPromise<any>;
        schemaLevels(): JQueryPromise<any>;
        schemaMeasures(): JQueryPromise<any>;
    }

    interface DataSourceTransport {
        create?: DataSourceTransportCreate;
        destroy?: DataSourceTransportDestroy;
        push?: Function;
        read?: DataSourceTransportRead;
        signalr?: DataSourceTransportSignalr;
        update?: DataSourceTransportUpdate;

        parameterMap?(data: DataSourceTransportParameterMapData, type: string): any;
    }

    interface DataSourceTransportSignalrClient {
        create?: string;
        destroy?: string;
        read?: string;
        update?: string;
    }

    interface DataSourceTransportSignalrServer {
        create?: string;
        destroy?: string;
        read?: string;
        update?: string;
    }

    interface DataSourceTransportSignalr {
        client?: DataSourceTransportSignalrClient;
        hub?: any;
        promise?: any;
        server?: DataSourceTransportSignalrServer;
    }


    interface DataSourceParameterMapDataAggregate {
        field?: string;
        aggregate?: string;
    }

    interface DataSourceParameterMapDataGroup {
        aggregate?: DataSourceParameterMapDataAggregate[];
        field?: string;
        dir?: string;
    }

    interface DataSourceParameterMapDataFilter {
        field?: string;
        filters?: DataSourceParameterMapDataFilter[];
        logic?: string;
        operator?: string;
        value?: any;
    }

    interface DataSourceParameterMapDataSort {
        field?: string;
        dir?: string;
    }

    interface DataSourceTransportParameterMapData {
        aggregate?: DataSourceParameterMapDataAggregate[];
        group?: DataSourceParameterMapDataGroup[];
        filter?: DataSourceParameterMapDataFilter;
        models?: Model[];
        page?: number;
        pageSize?: number;
        skip?: number;
        sort?: DataSourceParameterMapDataSort[];
        take?: number;
    }

    interface DataSourceSchema {
        model?: any;
    }

    interface DataSourceSchemaWithOptionsModel extends DataSourceSchema {
        model?: DataSourceSchemaModel;
    }

    interface DataSourceSchemaWithConstructorModel extends DataSourceSchema {
        model?:  typeof Model;
    }

    interface DataSourceSchemaModel {
        id?: string;
        fields?: any;
        [index: string]: any;
    }

    interface DataSourceSchemaModelWithFieldsArray extends DataSourceSchemaModel {
        fields?: DataSourceSchemaModelField[];
    }

    interface DataSourceSchemaModelWithFieldsObject extends DataSourceSchemaModel {
        fields?: DataSourceSchemaModelFields;
    }

    interface DataSourceSchemaModelFields {
        [index: string]: DataSourceSchemaModelField;
    }

    interface DataSourceSchemaModelField {
        field?: string;
        from?: string;
        defaultValue?: any;
        editable?: boolean;
        nullable?: boolean;
        parse?: Function;
        type?: string;
        validation?: DataSourceSchemaModelFieldValidation;
    }

    interface DataSourceSchemaModelFieldValidation {
        required?: boolean;
        min?: any;
        max?: any;
    }

    class ObservableArray extends Observable {
        length: number;
        [index: number]: any;

        constructor(array: any[]);
        init(array: any[]): void;
        empty(): void;
        every(callback: (item: Object, index: number, source: ObservableArray) => boolean): boolean;
        filter(callback: (item: Object, index: number, source: ObservableArray) => boolean): any[];
        find(callback: (item: Object, index: number, source: ObservableArray) => boolean): any;
        forEach(callback: (item: Object, index: number, source: ObservableArray) => void ): void;
        indexOf(item: any): number;
        join(separator: string): string;
        map(callback: (item: Object, index: number, source: ObservableArray) => any): any[];
        parent(): ObservableObject;
        pop(): ObservableObject;
        push(...items: any[]): number;
        remove(item: Object): void;
        shift(): any;
        slice(begin: number, end?: number): any[];
        some(callback: (item: Object, index: number, source: ObservableArray) => boolean): boolean;
        splice(start: number): any[];
        splice(start: number, deleteCount: number, ...items: any[]): any[];
        toJSON(): any[];
        unshift(...items: any[]): number;
        wrap(object: Object, parent: Object): any;
        wrapAll(source: Object, target: Object): any;
    }

    interface ObservableArrayEvent {
        field?: string;
        action?: string;
        index?: number;
        items?: kendo.data.Model[];
    }

    class DataSource extends Observable{
        options: DataSourceOptions;

        static create(options?: DataSourceOptions): DataSource;

        constructor(options?: DataSourceOptions);
        init(options?: DataSourceOptions): void;
        add(model: Object): kendo.data.Model;
        add(model: kendo.data.Model): kendo.data.Model;
        aggregate(val: any): void;
        aggregate(): any;
        aggregates(): any;
        at(index: number): kendo.data.ObservableObject;
        cancelChanges(model?: kendo.data.Model): void;
        data(): kendo.data.ObservableArray;
        data(value: any): void;
        fetch(callback?: Function): JQueryPromise<any>;
        filter(filters: DataSourceFilterItem): void;
        filter(filters: DataSourceFilterItem[]): void;
        filter(filters: DataSourceFilters): void;
        filter(): DataSourceFilters;
        get(id: any): kendo.data.Model;
        getByUid(uid: string): kendo.data.Model;
        group(groups: any): void;
        group(): any;
        hasChanges(): boolean;
        indexOf(value: kendo.data.ObservableObject): number;
        insert(index: number, model: kendo.data.Model): kendo.data.Model;
        insert(index: number, model: Object): kendo.data.Model;
        online(value: boolean): void;
        online(): boolean;
        offlineData(data: any[]): void;
        offlineData(): any[];
        page(): number;
        page(page: number): void;
        pageSize(): number;
        pageSize(size: number): void;
        pushCreate(model: Object): void;
        pushCreate(models: any[]): void;
        pushDestroy(model: Object): void;
        pushDestroy(models: any[]): void;
        pushUpdate(model: Object): void;
        pushUpdate(models: any[]): void;
        query(options?: any): JQueryPromise<any>;
        read(data?: any): JQueryPromise<any>;
        remove(model: kendo.data.ObservableObject): void;
        sort(sort: DataSourceSortItem): void;
        sort(sort: DataSourceSortItem[]): void;
        sort(): DataSourceSortItem[];
        sync(): JQueryPromise<any>;
        total(): number;
        totalPages(): number;
        view(): kendo.data.ObservableArray;
    }

    class Query {
        data: any[];

        static process(data: any[], options: DataSourceTransportReadOptionsData): QueryResult;

        constructor(data: any[]);
        toArray(): any[];
        range(intex: number, count: number): kendo.data.Query;
        skip(count: number): kendo.data.Query;
        take(count: number): kendo.data.Query;
        select(selector: Function): kendo.data.Query;
        order(selector: string, dir?: string): kendo.data.Query;
        order(selector: Function, dir?: string): kendo.data.Query;
        filter(filters: DataSourceFilterItem): kendo.data.Query;
        filter(filters: DataSourceFilterItem[]): kendo.data.Query;
        filter(filters: DataSourceFilters): kendo.data.Query;
        group(descriptors: DataSourceGroupItem): kendo.data.Query;
        group(descriptors: DataSourceGroupItem[]): kendo.data.Query;
    }

    interface QueryResult {
        total?: number;
        data?: any[];
    }

    interface DataSourceAggregateItem {
        field?: string;
        aggregate?: string;
    }

    interface DataSourceFilter {
    }

    interface DataSourceFilterItem extends DataSourceFilter {
        operator?: string;
        field?: string;
        value?: any;
    }

    interface DataSourceFilters extends DataSourceFilter {
        logic?: string;
        filters?: DataSourceFilter[];
    }

    interface DataSourceGroupItemAggregate {
        field?: string;
        aggregate?: string;
    }

    interface DataSourceGroupItem {
        field?: string;
        dir?: string;
        aggregates?: DataSourceGroupItemAggregate[];
    }

    interface DataSourceSchema {
        aggregates?: any;
        data?: any;
        errors?: any;
        groups?: any;
        parse?: Function;
        total?: any;
        type?: string;
    }

    interface DataSourceSortItem {
        field?: string;
        dir?: string;
    }

    interface DataSourceTransportCreate extends JQueryAjaxSettings {
        cache?: boolean;
        contentType?: string;
        data?: any;
        dataType?: string;
        type?: string;
        url?: any;
    }

    interface DataSourceTransportDestroy extends JQueryAjaxSettings {
        cache?: boolean;
        contentType?: string;
        data?: any;
        dataType?: string;
        type?: string;
        url?: any;
    }

    interface DataSourceTransportRead extends JQueryAjaxSettings {
        cache?: boolean;
        contentType?: string;
        data?: any;
        dataType?: string;
        type?: string;
        url?: any;
    }

    interface DataSourceTransportUpdate extends JQueryAjaxSettings {
        cache?: boolean;
        contentType?: string;
        data?: any;
        dataType?: string;
        type?: string;
        url?: any;
    }

    interface DataSourceTransportWithObjectOperations extends DataSourceTransport {
        create?: DataSourceTransportCreate;
        destroy?: DataSourceTransportDestroy;
        read?: DataSourceTransportRead;
        update?: DataSourceTransportUpdate;
    }

    interface DataSourceTransportWithFunctionOperations extends DataSourceTransport {
        create?: (options: DataSourceTransportOptions) => void;
        destroy?: (options: DataSourceTransportOptions) => void;
        read?: (options: DataSourceTransportReadOptions) => void;
        update?: (options: DataSourceTransportOptions) => void;
    }

    interface DataSourceTransportOptions {
        success: (data?: any) => void;
        error: (error?: any) => void;
        data: any;
    }

    interface DataSourceTransportReadOptionsData {
        sort?: DataSourceSortItem[];
        filter?: DataSourceFilters;
        group?: DataSourceGroupItem[];
        take?: number;
        skip?: number;
    }

    interface DataSourceTransportReadOptions extends DataSourceTransportOptions {
        data: DataSourceTransportReadOptionsData;
    }

    interface DataSourceTransportBatchOptionsData {
        models: any[];
    }

    interface DataSourceTransportBatchOptions extends DataSourceTransportOptions {
        data: DataSourceTransportBatchOptionsData;
    }

    interface DataSourceOptions {
        aggregate?: DataSourceAggregateItem[];
        autoSync?: boolean;
        batch?: boolean;
        data?: any;
        filter?: any;
        group?: DataSourceGroupItem[];
        offlineStorage?: any;
        page?: number;
        pageSize?: number;
        schema?: DataSourceSchema;
        serverAggregates?: boolean;
        serverFiltering?: boolean;
        serverGrouping?: boolean;
        serverPaging?: boolean;
        serverSorting?: boolean;
        sort?: any;
        transport?: DataSourceTransport;
        type?: string;
        change? (e: DataSourceChangeEvent): void;
        error?(e: DataSourceErrorEvent): void;
        sync?(e: DataSourceEvent): void;
        requestStart?(e: DataSourceRequestStartEvent): void;
        requestEnd?(e: DataSourceRequestEndEvent): void;
    }

    interface DataSourceEvent {
        sender?: DataSource;
    }

    interface DataSourceItemOrGroup {
    }

    interface DataSourceGroup extends DataSourceItemOrGroup {
        aggregates: any[];
        field: string;
        hasSubgroups: boolean;
        items: DataSourceItemOrGroup[];
        value: any;
    }

    interface DataSourceChangeEvent extends DataSourceEvent {
        field?: string;
        value?: Model;
        action?: string;
        index?: number;
        items?: DataSourceItemOrGroup[];
        node?: any;
    }

    interface DataSourceErrorEvent extends DataSourceEvent {
        xhr: JQueryXHR;
        status: string;
        errorThrown: any;
        errors?: any;
    }

    interface DataSourceRequestStartEvent extends DataSourceEvent {
        type?: string;
    }

    interface DataSourceRequestEndEvent extends DataSourceEvent {
        response?: any;
        type?: string;
    }
}

declare module kendo.data.transports {
    var odata: DataSourceTransport;
}

declare module kendo.ui {
    function progress(container: JQuery, toggle: boolean): void;

    class Widget extends Observable {
        static fn: Widget;

        element: JQuery;
        options: Object;
        events: string[];

        static extend(prototype: Object): Widget;

        constructor(element: Element, options?: Object);
        constructor(element: JQuery, options?: Object);
        constructor(selector: String, options?: Object);
        init(element: Element, options?: Object): void;
        init(element: JQuery, options?: Object): void;
        init(selector: String, options?: Object): void;
        destroy(): void;
        setOptions(options: Object): void;
        resize(force?: boolean): void;
    }

    function plugin(widget: typeof kendo.ui.Widget, register?: typeof kendo.ui, prefix?: String): void;
    function plugin(widget: any, register?: typeof kendo.ui, prefix?: String): void;
    function plugin(widget: typeof kendo.ui.Widget, register?: typeof kendo.mobile.ui, prefix?: String): void;
    function plugin(widget: any, register?: typeof kendo.mobile.ui, prefix?: String): void;

    class Draggable extends kendo.ui.Widget{
        element: JQuery;
        currentTarget: JQuery;
        constructor(element: Element, options?: DraggableOptions);
        options: DraggableOptions;
    }

    interface DraggableEvent {
        sender?: Draggable;
    }

    class DropTarget extends kendo.ui.Widget{
        element: JQuery;
        constructor(element: Element, options?: DropTargetOptions);
        options: DropTargetOptions;
        static destroyGroup(groupName: string): void;
    }

    interface DropTargetOptions {
        group?: string;
        dragenter?(e: DropTargetDragenterEvent): void;
        dragleave?(e: DropTargetDragleaveEvent): void;
        drop?(e: DropTargetDropEvent): void;
    }

    interface DropTargetEvent {
        sender?: DropTarget;
    }

    interface DropTargetDragenterEvent extends DropTargetEvent {
        draggable?: kendo.ui.Draggable;
    }

    interface DropTargetDragleaveEvent extends DropTargetEvent {
        draggable?: kendo.ui.Draggable;
    }

    interface DropTargetDropEvent extends DropTargetEvent {
        draggable?: kendo.ui.Draggable;
    }

    class DropTargetArea extends kendo.ui.Widget{
        element: JQuery;
        constructor(element: Element, options?: DropTargetAreaOptions);
        options: DropTargetAreaOptions;
    }

    interface DropTargetAreaOptions {
        group?: string;
        filter?: string;
        dragenter?(e: DropTargetAreaDragenterEvent): void;
        dragleave?(e: DropTargetAreaDragleaveEvent): void;
        drop?(e: DropTargetAreaDropEvent): void;
    }

    interface DropTargetAreaEvent {
        sender: DropTargetArea;
    }

    interface DropTargetAreaDragenterEvent extends DropTargetAreaEvent {
        draggable?: JQuery;
        dropTarget?: JQuery;
    }

    interface DropTargetAreaDragleaveEvent extends DropTargetAreaEvent {
        draggable?: JQuery;
        dropTarget?: JQuery;
    }

    interface DropTargetAreaDropEvent extends DropTargetAreaEvent {
        draggable?: kendo.ui.Draggable;
        dropTarget?: JQuery;
    }

    interface DraggableOptions {
        axis?: string;
        container?: JQuery;
        cursorOffset?: any;
        distance?: number;
        filter?: string;
        group?: string;
        hint?: Function;
        ignore?: string;
        drag?(e: DraggableEvent): void;
        dragcancel?(e: DraggableEvent): void;
        dragend?(e: DraggableEvent): void;
        dragstart?(e: DraggableEvent): void;
    }

    interface GridColumnEditorOptions {
        field?: string;
        format?: string;
        model?: kendo.data.Model;
        values?: any[];
    }

    interface GridColumn {
        editor?(container: JQuery, options: GridColumnEditorOptions): void;
    }

    interface TreeListEditorOptions {
        field?: string;
        format?: string;
        model?: kendo.data.Model;
        values?: any[];
    }

    interface TreeListColumn {
        editor?(container: JQuery, options: TreeListEditorOptions): void;
    }
}

declare module kendo.mobile {
    function init(selector: string): void;
    function init(element: JQuery): void;
    function init(element: Element): void;

    class Application extends Observable {
        options: ApplicationOptions;
        router: kendo.Router;
        pane: kendo.mobile.ui.Pane;

        constructor(element?: any, options?: ApplicationOptions);
        init(element?: any, options?: ApplicationOptions): void;
        hideLoading(): void;
        navigate(url: string, transition?: string): void;
        replace(url: string, transition?: string): void;
        scroller(): kendo.mobile.ui.Scroller;
        showLoading(): void;
        view(): kendo.mobile.ui.View;
    }

    interface ApplicationOptions {
        browserHistory?: boolean;
        hideAddressBar?: boolean;
        updateDocumentTitle?: boolean;
        initial?: string;
        layout?: string;
        loading?: string;
        modelScope?: Object;
        platform?: string;
        retina?: boolean;
        serverNavigation?: boolean;
        skin?: string;
        statusBarStyle?: string;
        transition?: string;
        useNativeScrolling?: boolean;
    }

    interface ApplicationEvent {
        sender: Application;
    }
}

declare module kendo.mobile.ui {

    class Widget extends kendo.ui.Widget {
    }

    interface TouchAxis {
        location?: number;
        startLocation?: number;
        client?: number;
        delta?: number;
        velocity?: number;
    }

    interface TouchEventOptions {
        target?: JQuery;
        x?: TouchAxis;
        y?: TouchAxis;
    }

    interface Point {
        x?: number;
        y?: number;
    }
}
declare module kendo.drawing {
    class Arc extends kendo.drawing.Element {


        options: ArcOptions;


        constructor(geometry: kendo.geometry.Arc, options?: ArcOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the arc geometry.
        @method
        @returns The current arc geometry.
        */
        geometry(): kendo.geometry.Arc;
        /**
        Gets or sets the arc geometry.
        @method
        @param value - The new geometry to use.
        */
        geometry(value: kendo.geometry.Arc): void;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Arc;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Arc;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface ArcOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface ArcEvent {
        sender: Arc;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Circle extends kendo.drawing.Element {


        options: CircleOptions;


        constructor(geometry: kendo.geometry.Circle, options?: CircleOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the circle geometry.
        @method
        @returns The current circle geometry.
        */
        geometry(): kendo.geometry.Circle;
        /**
        Gets or sets the circle geometry.
        @method
        @param value - The new geometry to use.
        */
        geometry(value: kendo.geometry.Circle): void;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Circle;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Circle;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface CircleOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface CircleEvent {
        sender: Circle;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Element extends kendo.Class {


        options: ElementOptions;


        constructor(options?: ElementOptions);


        /**
        Returns the bounding box of the element with transformations applied.
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.This is the rectangle that will fit around the actual rendered element.
        @method
        @returns The bounding box of the element with clipping and transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Gets or sets the transformation of the element.
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface ElementOptions {
        name?: string;
        /**
        The clipping path for this element.The path instance will be monitored for changes.
It can be replaced by calling the clip method.
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element CSS cursor.Applicable to SVG and VML outputs.
        @member {string}
        */
        cursor?: string;
        /**
        The element opacity.
        @member {number}
        */
        opacity?: number;
        /**
        The transformation to apply to this element.
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
        @member {boolean}
        */
        visible?: boolean;
    }
    interface ElementEvent {
        sender: Element;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    interface FillOptions  {



        /**
                The fill color in any of the following formats.| Format         | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the fill.
                */
                color?: string;
        /**
                The fill opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
                */
                opacity?: number;




    }



    class Gradient extends kendo.Class {


        options: GradientOptions;

        /**
                The array of gradient color stops.
Contains GradientStop instances.
                */
                stops: any;

        constructor(options?: GradientOptions);


        /**
        Adds a color stop to the gradient.
        @method
        @param offset - The stop offset from the start of the element.
Ranges from 0 (start of gradient) to 1 (end of gradient).
        @param color - The color in any of the following formats.| Format         | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the fill.
        @param opacity - The fill opacity.
Ranges from 0 (completely transparent) to 1 (completely opaque).
        @returns The new gradient color stop.
        */
        addStop(offset: number, color: string, opacity: number): kendo.drawing.GradientStop;
        /**
        Removes a color stop from the gradient.
        @method
        @param stop - The gradient color stop to remove.
        */
        removeStop(stop: kendo.drawing.GradientStop): void;

    }

    interface GradientOptions {
        name?: string;
        /**
        The color stops of the gradient.
Can contain either plain objects or GradientStop instances.
        @member {any}
        */
        stops?: any;
    }
    interface GradientEvent {
        sender: Gradient;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class GradientStop extends kendo.Class {


        options: GradientStopOptions;


        constructor(options?: GradientStopOptions);



    }

    interface GradientStopOptions {
        name?: string;
        /**
        The stop offset from the start of the element.
Ranges from 0 (start of gradient) to 1 (end of gradient).
        @member {number}
        */
        offset?: number;
        /**
        The color in any of the following formats.| Format         | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the fill.
        @member {string}
        */
        color?: string;
        /**
        The fill opacity.
Ranges from 0 (completely transparent) to 1 (completely opaque).
        @member {number}
        */
        opacity?: number;
    }
    interface GradientStopEvent {
        sender: GradientStop;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Group extends kendo.drawing.Element {


        options: GroupOptions;

        /**
                The children of this group.
                */
                children: any;

        constructor(options?: GroupOptions);


        /**
        Appends the specified element as a last child of the group.
        @method
        @param element - The element to append. Multiple parameters are accepted.
        */
        append(element: kendo.drawing.Element): void;
        /**
        Removes all child elements from the group.
        @method
        */
        clear(): void;
        /**
        Gets or sets the group clipping path.
Inherited from Element.clip
        @method
        @returns The current group clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the group clipping path.
Inherited from Element.clip
        @method
        @param clip - The group clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Inserts an element at the specified position.
        @method
        @param position - The position to insert the element at. Existing children beyond this position will be shifted right.
        @param element - The element to insert.
        */
        insert(position: number, element: kendo.drawing.Element): void;
        /**
        Gets or sets the group opacity.
Inherited from Element.opacityThe opacity of any child groups and elements will be multiplied by this value.
        @method
        @returns The current group opacity.
        */
        opacity(): number;
        /**
        Gets or sets the group opacity.
Inherited from Element.opacityThe opacity of any child groups and elements will be multiplied by this value.
        @method
        @param opacity - The group opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Removes the specified element from the group.
        @method
        @param element - The element to remove.
        */
        remove(element: kendo.drawing.Element): void;
        /**
        Removes the child element at the specified position.
        @method
        @param index - The index at which the element currently resides.
        */
        removeAt(index: number): void;
        /**
        Gets or sets the visibility of the element.
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface GroupOptions {
        name?: string;
        /**
        The group clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The group cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The group opacity.
Inherited from Element.opacityThe opacity of any child groups and elements will be multiplied by this value.
        @member {number}
        */
        opacity?: number;
        /**
        Page options to apply during PDF export.
        @member {kendo.drawing.PDFOptions}
        */
        pdf?: kendo.drawing.PDFOptions;
        /**
        The transformation to apply to this group and its children.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the group and its children are visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface GroupEvent {
        sender: Group;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Image extends kendo.drawing.Element {


        options: ImageOptions;


        constructor(src: string, rect: kendo.geometry.Rect);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacity
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacity
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Gets or sets the image source URL.
        @method
        @returns The current image source URL.
        */
        src(): string;
        /**
        Gets or sets the image source URL.
        @method
        @param value - The new source URL.
        */
        src(value: string): void;
        /**
        Gets or sets the rectangle defines the image position and size.
        @method
        @returns The current image rectangle.
        */
        rect(): kendo.geometry.Rect;
        /**
        Gets or sets the rectangle defines the image position and size.
        @method
        @param value - The new image rectangle.
        */
        rect(value: kendo.geometry.Rect): void;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface ImageOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface ImageEvent {
        sender: Image;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Layout extends kendo.drawing.Group {


        options: LayoutOptions;


        constructor(rect: kendo.geometry.Rect, options?: LayoutOptions);


        /**
        Gets or sets the layout rectangle.
        @method
        @returns The current rectangle.
        */
        rect(): kendo.geometry.Rect;
        /**
        Gets or sets the layout rectangle.
        @method
        @param rect - The layout rectangle.
        */
        rect(rect: kendo.geometry.Rect): void;
        /**
        Arranges the elements based on the current options.
        @method
        */
        reflow(): void;

    }

    interface LayoutOptions {
        name?: string;
        /**
        Specifies the alignment of the content. The supported values are:
        @member {string}
        */
        alignContent?: string;
        /**
        Specifies the alignment of the items based on the largest one. The supported values are:
        @member {string}
        */
        alignItems?: string;
        /**
        Specifies how should the content be justified. The supported values are:
        @member {string}
        */
        justifyContent?: string;
        /**
        Specifies the distance between the lines for wrapped layout.
        @member {number}
        */
        lineSpacing?: number;
        /**
        Specifies the distance between the elements.
        @member {number}
        */
        spacing?: number;
        /**
        Specifies layout orientation. The supported values are:
        @member {string}
        */
        orientation?: string;
        /**
        Specifies the behavior when the elements size exceeds the rectangle size. If set to true, the elements will be moved to the next "line". If set to false, the layout will be scaled so that the elements fit in the rectangle.
        @member {boolean}
        */
        wrap?: boolean;
    }
    interface LayoutEvent {
        sender: Layout;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class LinearGradient extends kendo.drawing.Gradient {


        options: LinearGradientOptions;

        /**
                The array of gradient color stops.
Contains GradientStop instances.
                */
                stops: any;

        constructor(options?: LinearGradientOptions);


        /**
        Adds a color stop to the gradient.
Inherited from Gradient.addStop
        @method
        @param offset - 
        @param color - The color of the stop.
        @param opacity - The fill opacity.
        @returns The new gradient color stop.
        */
        addStop(offset: number, color: string, opacity: number): kendo.drawing.GradientStop;
        /**
        Gets or sets the end point of the gradient.
        @method
        @returns The current end point of the gradient.
        */
        end(): kendo.geometry.Point;
        /**
        Gets or sets the end point of the gradient.
        @method
        @param end - The end point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        end(end: any): void;
        /**
        Gets or sets the end point of the gradient.
        @method
        @param end - The end point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        end(end: kendo.geometry.Point): void;
        /**
        Gets or sets the start point of the gradient.
        @method
        @returns The current start point of the gradient.
        */
        start(): kendo.geometry.Point;
        /**
        Gets or sets the start point of the gradient.
        @method
        @param start - The start point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        start(start: any): void;
        /**
        Gets or sets the start point of the gradient.
        @method
        @param start - The start point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        start(start: kendo.geometry.Point): void;
        /**
        Removes a color stop from the gradient.
Inherited from Gradient.removeStop
        @method
        @param stop - The gradient color stop to remove.
        */
        removeStop(stop: kendo.drawing.GradientStop): void;

    }

    interface LinearGradientOptions {
        name?: string;
        /**
        The color stops of the gradient.
Can contain either plain objects or GradientStop instances.
        @member {any}
        */
        stops?: any;
    }
    interface LinearGradientEvent {
        sender: LinearGradient;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class MultiPath extends kendo.drawing.Element {


        options: MultiPathOptions;

        /**
                A collection of sub-paths.
                */
                paths: any;

        constructor(options?: MultiPathOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Closes the current sub-path by linking its current end point with its start point.
        @method
        @returns The current instance to allow chaining.
        */
        close(): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.MultiPath;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: number, y?: number): kendo.drawing.MultiPath;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: any, y?: number): kendo.drawing.MultiPath;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: kendo.geometry.Point, y?: number): kendo.drawing.MultiPath;
        /**
        Creates a new sub-path or clears all segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: number, y?: number): kendo.drawing.MultiPath;
        /**
        Creates a new sub-path or clears all segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: any, y?: number): kendo.drawing.MultiPath;
        /**
        Creates a new sub-path or clears all segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: kendo.geometry.Point, y?: number): kendo.drawing.MultiPath;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.MultiPath;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface MultiPathOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface MultiPathEvent {
        sender: MultiPath;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class OptionsStore extends kendo.Class {


        options: OptionsStoreOptions;

        /**
                An optional observer for the options store.Upon field modification, the optionsChange(e) method on the observer will be called
with a single argument containing two fields:
* field - The fully qualified field name
* value - The new field value
                */
                observer: any;

        constructor(options?: OptionsStoreOptions);


        /**
        Gets the value of the specified option.
        @method
        @param field - The field name to retrieve.
Must be a fully qualified name (e.g. "foo.bar") for nested options.
        @returns The current option value.
        */
        get(field: string): any;
        /**
        Sets the value of the specified option.
        @method
        @param field - The name of the option to set.
Must be a fully qualified name (e.g. "foo.bar") for nested options.
        @param value - The new option value.If the new value is exactly the same as the new value the operation
will not trigger options change on the observer (if any).
        */
        set(field: string, value: any): void;

    }

    interface OptionsStoreOptions {
        name?: string;
    }
    interface OptionsStoreEvent {
        sender: OptionsStore;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    interface PDFOptions  {



        /**
                The creator of the PDF document.
                */
                creator?: string;
        /**
                The date when the PDF document is created. Defaults to new Date().
                */
                date?: Date;
        /**
                Specifies the keywords of the exported PDF file.
                */
                keywords?: string;
        /**
                Set to true to reverse the paper dimensions if needed such that width is the larger edge.
                */
                landscape?: boolean;
        /**
                Specifies the margins of the page (numbers or strings with units). Supported
units are "mm", "cm", "in" and "pt" (default).
                */
                margin?: any;
        /**
                Specifies the paper size of the PDF document.
The default "auto" means paper size is determined by content.Supported values:
                */
                paperSize?: any;
        /**
                Sets the subject of the PDF file.
                */
                subject?: string;
        /**
                Sets the title of the PDF file.
                */
                title?: string;




    }



    class Path extends kendo.drawing.Element {


        options: PathOptions;

        /**
                A collection of the path segments.
                */
                segments: any;

        constructor(options?: PathOptions);

        static fromPoints(points: any): kendo.drawing.Path;
        static fromRect(rect: kendo.geometry.Rect): kendo.drawing.Path;
        static parse(svgPath: string, options?: any): kendo.drawing.Path;

        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Closes the path by linking the current end point with the start point.
        @method
        @returns The current instance to allow chaining.
        */
        close(): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Path;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: number, y?: number): kendo.drawing.Path;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: any, y?: number): kendo.drawing.Path;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: kendo.geometry.Point, y?: number): kendo.drawing.Path;
        /**
        Clears all existing segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: number, y?: number): kendo.drawing.Path;
        /**
        Clears all existing segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: any, y?: number): kendo.drawing.Path;
        /**
        Clears all existing segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: kendo.geometry.Point, y?: number): kendo.drawing.Path;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Path;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface PathOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface PathEvent {
        sender: Path;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class RadialGradient extends kendo.drawing.Gradient {


        options: RadialGradientOptions;

        /**
                The array of gradient color stops.
Contains GradientStop instances.
                */
                stops: any;

        constructor(options?: RadialGradientOptions);


        /**
        Adds a color stop to the gradient.
Inherited from Gradient.addStop
        @method
        @param offset - 
        @param color - The color of the stop.
        @param opacity - The fill opacity.
        @returns The new gradient color stop.
        */
        addStop(offset: number, color: string, opacity: number): kendo.drawing.GradientStop;
        /**
        Gets or sets the center point of the gradient.
        @method
        @returns The current radius of the gradient.
        */
        center(): kendo.geometry.Point;
        /**
        Gets or sets the center point of the gradient.
        @method
        @param center - The center point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        center(center: any): void;
        /**
        Gets or sets the center point of the gradient.
        @method
        @param center - The center point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        center(center: kendo.geometry.Point): void;
        /**
        Gets or sets the radius of the gradient.
        @method
        @returns The current radius of the gradient.
        */
        radius(): number;
        /**
        Gets or sets the radius of the gradient.
        @method
        @param value - The new radius of the gradient.
        */
        radius(value: number): void;
        /**
        Removes a color stop from the gradient.
Inherited from Gradient.removeStop
        @method
        @param stop - The gradient color stop to remove.
        */
        removeStop(stop: kendo.drawing.GradientStop): void;

    }

    interface RadialGradientOptions {
        name?: string;
        /**
        The center of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        @member {any|kendo.geometry.Point}
        */
        center?: any|kendo.geometry.Point;
        /**
        The radius of the radial gradient relative to the shape bounding box.
        @member {number}
        */
        radius?: number;
        /**
        The color stops of the gradient.
Can contain either plain objects or GradientStop instances.
        @member {any}
        */
        stops?: any;
    }
    interface RadialGradientEvent {
        sender: RadialGradient;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Rect extends kendo.drawing.Element {


        options: RectOptions;


        constructor(geometry: kendo.geometry.Rect, options?: RectOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the rectangle geometry.
        @method
        @returns The current rectangle geometry.
        */
        geometry(): kendo.geometry.Rect;
        /**
        Gets or sets the rectangle geometry.
        @method
        @param value - The new geometry to use.
        */
        geometry(value: kendo.geometry.Rect): void;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Rect;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Rect;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface RectOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface RectEvent {
        sender: Rect;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Segment extends kendo.Class {


        options: SegmentOptions;


        constructor(anchor: kendo.geometry.Point, controlIn: kendo.geometry.Point, controlOut: kendo.geometry.Point);


        /**
        Gets or sets the segment anchor point.The setter returns the current Segment to allow chaining.
        @method
        @returns The current anchor point.
        */
        anchor(): kendo.geometry.Point;
        /**
        Gets or sets the segment anchor point.The setter returns the current Segment to allow chaining.
        @method
        @param value - The new anchor point.
        */
        anchor(value: kendo.geometry.Point): void;
        /**
        Gets or sets the first curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @returns The current control point.
        */
        controlIn(): kendo.geometry.Point;
        /**
        Gets or sets the first curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @param value - The new control point.
        */
        controlIn(value: kendo.geometry.Point): void;
        /**
        Gets or sets the second curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @returns The current control point.
        */
        controlOut(): kendo.geometry.Point;
        /**
        Gets or sets the second curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @param value - The new control point.
        */
        controlOut(value: kendo.geometry.Point): void;

    }

    interface SegmentOptions {
        name?: string;
    }
    interface SegmentEvent {
        sender: Segment;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    interface StrokeOptions  {



        /**
                The stroke color in any of the following formats.| Value          | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the stroke.
                */
                color?: string;
        /**
                The stroke dash type.| Value            |                                              | Description
| ---              | :---:                                        | ---
| dash           |               | a line consisting of dashes
| dashDot        |           | a line consisting of a repeating pattern of dash-dot
| dot            |                | a line consisting of dots
| longDash       |          | a line consisting of a repeating pattern of long-dash
| longDashDot    |      | a line consisting of a repeating pattern of long-dash dot
| longDashDotDot |  | a line consisting of a repeating pattern of long-dash dot-dot
| solid          |              | a solid line
                */
                dashType?: string;
        /**
                The stroke line cap style.| Value    |                                     | Description
| ---      | :---:                               | ---
| butt   |    | a flat edge with no cap
| round  |   | a rounded cap
| square |  | a square cap
                */
                lineCap?: string;
        /**
                The stroke line join style.| Value   |                                     | Description
| ---     | :---:                               | ---
| bevel |  | a beveled join
| miter |  | a square join
| round |  | a rounded join
                */
                lineJoin?: string;
        /**
                The stroke opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
                */
                opacity?: number;
        /**
                The stroke width in pixels.
                */
                width?: number;




    }



    class Surface extends kendo.Observable {


        options: SurfaceOptions;


        constructor(options?: SurfaceOptions);

        static create(element: JQuery, options?: any): kendo.drawing.Surface;
        static create(element: Element, options?: any): kendo.drawing.Surface;

        /**
        Clears the drawing surface.
        @method
        */
        clear(): void;
        /**
        Draws the element and its children on the surface.
Existing elements will remain visible.
        @method
        @param element - The element to draw.
        */
        draw(element: kendo.drawing.Element): void;
        /**
        Returns the target drawing element of a DOM event.
        @method
        @param e - The original DOM or jQuery event object.
        @returns The target drawing element, if any.
        */
        eventTarget(e: any): kendo.drawing.Element;
        /**
        Resizes the surface to match the size of the container.
        @method
        @param force - Whether to proceed with resizing even if the container dimensions have not changed.
        */
        resize(force?: boolean): void;

    }

    interface SurfaceOptions {
        name?: string;
        /**
        The preferred type of surface to create.
Supported types (case insensitive):
- svg
- canvas
- vmlThis option will be ignored if not supported by the browser.
See Supported Browsers.
        @member {string}
        */
        type?: string;
        /**
        The height of the surface element.
By default the surface will expand to fill the height of the first positioned container.
        @member {string}
        */
        height?: string;
        /**
        The width of the surface element.
By default the surface will expand to fill the width of the first positioned container.
        @member {string}
        */
        width?: string;
        /**
        Triggered when an element has been clicked.
        */
        click?(e: SurfaceClickEvent): void;
        /**
        Triggered when the mouse is moved over an element.
        */
        mouseenter?(e: SurfaceMouseenterEvent): void;
        /**
        Triggered when the mouse is leaves an element.
        */
        mouseleave?(e: SurfaceMouseleaveEvent): void;
    }
    interface SurfaceEvent {
        sender: Surface;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface SurfaceClickEvent extends SurfaceEvent {
        /**
        The clicked element.
        @member {kendo.drawing.Element}
        */
        element?: kendo.drawing.Element;
        /**
        The browser event that triggered the click.
        @member {any}
        */
        originalEvent?: any;
    }

    interface SurfaceMouseenterEvent extends SurfaceEvent {
        /**
        The target element.
        @member {kendo.drawing.Element}
        */
        element?: kendo.drawing.Element;
        /**
        The browser event that triggered the click.
        @member {any}
        */
        originalEvent?: any;
    }

    interface SurfaceMouseleaveEvent extends SurfaceEvent {
        /**
        The target element.
        @member {kendo.drawing.Element}
        */
        element?: kendo.drawing.Element;
        /**
        The browser event that triggered the click.
        @member {any}
        */
        originalEvent?: any;
    }


    class Text extends kendo.drawing.Element {


        options: TextOptions;


        constructor(content: string, position: kendo.geometry.Point, options?: TextOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the text content.
        @method
        @returns The current content of the text.
        */
        content(): string;
        /**
        Gets or sets the text content.
        @method
        @param value - The new text content to set.
        */
        content(value: string): void;
        /**
        Sets the text fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Text;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Gets or sets the position of the text upper left corner.
        @method
        @returns The current position of the text upper left corner.
        */
        position(): kendo.geometry.Point;
        /**
        Gets or sets the position of the text upper left corner.
        @method
        @param value - The new position of the text upper left corner.
        */
        position(value: kendo.geometry.Point): void;
        /**
        Sets the text stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Text;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface TextOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the text.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The font to use for rendering the text.
Accepts the standard CSS font syntax.Examples of valid font values:
* Size and family: "2em 'Open Sans', sans-serif"
* Style, size and family: "italic 2em 'Open Sans', sans-serif"
        @member {string}
        */
        font?: string;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the text.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface TextEvent {
        sender: Text;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


}
declare module kendo.geometry {
    class Arc extends Observable {


        options: ArcOptions;

        /**
                A flag indicating if the arc should be drawn in clockwise or anticlockwise direction.
Defaults to clockwise direction.
                */
                anticlockwise: boolean;
        /**
                The location of the arc center.
                */
                center: kendo.geometry.Point;
        /**
                The end angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
                */
                endAngle: number;
        /**
                The x radius of the arc.
                */
                radiusX: number;
        /**
                The y radius of the arc.
                */
                radiusY: number;
        /**
                The start angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
                */
                startAngle: number;



        /**
        Returns the bounding box of this arc after applying the specified transformation matrix.
        @method
        @param matrix - Transformation matrix to apply.
        @returns The bounding box after applying the transformation matrix.
        */
        bbox(matrix: kendo.geometry.Matrix): kendo.geometry.Rect;
        /**
        Gets the arc anticlokwise flag.
        @method
        @returns The anticlokwise flag of the arc.
        */
        getAnticlockwise(): boolean;
        /**
        Gets the arc center location.
        @method
        @returns The location of the arc center.
        */
        getCenter(): kendo.geometry.Point;
        /**
        Gets the end angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @returns The end angle of the arc.
        */
        getEndAngle(): number;
        /**
        Gets the x radius of the arc.
        @method
        @returns The x radius of the arc.
        */
        getRadiusX(): number;
        /**
        Gets the y radius of the arc.
        @method
        @returns The y radius of the arc.
        */
        getRadiusY(): number;
        /**
        Gets the start angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @returns The start angle of the arc.
        */
        getStartAngle(): number;
        /**
        Gets the location of a point on the arc's circumference at a given angle.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @returns The point on the arc's circumference.
        */
        pointAt(angle: number): kendo.geometry.Point;
        /**
        Sets the arc anticlokwise flag.
        @method
        @param value - The new anticlockwise value.
        @returns The current arc instance.
        */
        setAnticlockwise(value: boolean): kendo.geometry.Arc;
        /**
        Sets the arc center location.
        @method
        @param value - The new arc center.
        @returns The current arc instance.
        */
        setCenter(value: kendo.geometry.Point): kendo.geometry.Arc;
        /**
        Sets the end angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @param value - The new arc end angle.
        @returns The current arc instance.
        */
        setEndAngle(value: number): kendo.geometry.Arc;
        /**
        Sets the x radius of the arc.
        @method
        @param value - The new arc x radius.
        @returns The current arc instance.
        */
        setRadiusX(value: number): kendo.geometry.Arc;
        /**
        Sets the y radius of the arc.
        @method
        @param value - The new arc y radius.
        @returns The current arc instance.
        */
        setRadiusY(value: number): kendo.geometry.Arc;
        /**
        Sets the start angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @param value - The new arc atart angle.
        @returns The current arc instance.
        */
        setStartAngle(value: number): kendo.geometry.Arc;

    }

    interface ArcOptions {
        name?: string;
    }
    interface ArcEvent {
        sender: Arc;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Circle extends Observable {


        options: CircleOptions;

        /**
                The location of the circle center.
                */
                center: kendo.geometry.Point;
        /**
                The radius of the circle.
                */
                radius: number;



        /**
        Returns the bounding box of this circle after applying the
specified transformation matrix.
        @method
        @param matrix - Transformation matrix to apply.
        @returns The bounding box after applying the transformation matrix.
        */
        bbox(matrix: kendo.geometry.Matrix): kendo.geometry.Rect;
        /**
        Creates a new instance with the same center and radius.
        @method
        @returns A new Circle instance with the same center and radius.
        */
        clone(): kendo.geometry.Circle;
        /**
        Compares this circle with another instance.
        @method
        @param other - The circle to compare with.
        @returns true if the point coordinates match; false otherwise.
        */
        equals(other: kendo.geometry.Circle): boolean;
        /**
        Gets the circle center location.
        @method
        @returns The location of the circle center.
        */
        getCenter(): kendo.geometry.Point;
        /**
        Gets the circle radius.
        @method
        @returns The radius of the circle.
        */
        getRadius(): number;
        /**
        Gets the location of a point on the circle's circumference at a given angle.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @returns The point on the circle's circumference.
        */
        pointAt(angle: number): kendo.geometry.Point;
        /**
        Sets the location of the circle center.
        @method
        @param value - The new center Point or equivalent [x, y] array.
        @returns The location of the circle center.
        */
        setCenter(value: kendo.geometry.Point): kendo.geometry.Point;
        /**
        Sets the location of the circle center.
        @method
        @param value - The new center Point or equivalent [x, y] array.
        @returns The location of the circle center.
        */
        setCenter(value: any): kendo.geometry.Point;
        /**
        Sets the circle radius.
        @method
        @param value - The new circle radius.
        @returns The current circle instance.
        */
        setRadius(value: number): kendo.geometry.Circle;

    }

    interface CircleOptions {
        name?: string;
    }
    interface CircleEvent {
        sender: Circle;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Matrix extends Observable {


        options: MatrixOptions;

        /**
                The a (1, 1) member of the matrix.
                */
                a: number;
        /**
                The b (2, 1) member of the matrix.
                */
                b: number;
        /**
                The a (1, 2) member of the matrix.
                */
                c: number;
        /**
                The d (2, 2) member of the matrix.
                */
                d: number;
        /**
                The e (1, 3) member of the matrix.
                */
                e: number;
        /**
                The f (2, 3) member of the matrix.
                */
                f: number;


        static rotate(angle: number, x: number, y: number): kendo.geometry.Matrix;
        static scale(scaleX: number, scaleY: number): kendo.geometry.Matrix;
        static translate(x: number, y: number): kendo.geometry.Matrix;
        static unit(): kendo.geometry.Matrix;

        /**
        Creates a new instance with the same element values.
        @method
        @returns A new Matrix instance with the same element values.
        */
        clone(): kendo.geometry.Matrix;
        /**
        Compares this matrix with another instance.
        @method
        @param other - The matrix instance to compare with.
        @returns true if the matrix elements match; false otherwise.
        */
        equals(other: kendo.geometry.Matrix): boolean;
        /**
        Rounds the matrix elements to the specified number of fractional digits.
        @method
        @param digits - Number of fractional digits.
        @returns The current matrix instance.
        */
        round(digits: number): kendo.geometry.Matrix;
        /**
        Multiplies the matrix with another one and returns the result as new instance.
The current instance elements are not altered.
        @method
        @param matrix - The matrix to multiply by.
        @returns The result of the multiplication.
        */
        multiplyCopy(matrix: kendo.geometry.Matrix): kendo.geometry.Matrix;
        /**
        Returns the matrix elements as an [a, b, c, d, e, f] array.
        @method
        @param digits - (Optional) Number of fractional digits.
        @returns An array representation of the matrix.
        */
        toArray(digits: number): any;
        /**
        Formats the matrix elements as a string.
        @method
        @param digits - (Optional) Number of fractional digits.
        @param separator - The separator to place between elements.
        @returns A string representation of the matrix, e.g. "1, 0, 0, 1, 0, 0".
        */
        toString(digits: number, separator: string): string;

    }

    interface MatrixOptions {
        name?: string;
    }
    interface MatrixEvent {
        sender: Matrix;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Point extends Observable {


        options: PointOptions;

        /**
                The x coordinate of the point.
                */
                x: number;
        /**
                The y coordinate of the point.
                */
                y: number;

        constructor(x: number, y: number);

        static create(x: number, y: number): kendo.geometry.Point;
        static create(x: any, y: number): kendo.geometry.Point;
        static create(x: kendo.geometry.Point, y: number): kendo.geometry.Point;
        static min(): kendo.geometry.Point;
        static max(): kendo.geometry.Point;
        static minPoint(): kendo.geometry.Point;
        static maxPoint(): kendo.geometry.Point;

        /**
        Creates a new instance with the same coordinates.
        @method
        @returns A new Point instance with the same coordinates.
        */
        clone(): kendo.geometry.Point;
        /**
        Calculates the distance to another point.
        @method
        @param point - The point to calculate the distance to.
        @returns The straight line distance to the given point.
        */
        distanceTo(point: kendo.geometry.Point): number;
        /**
        Compares this point with another instance.
        @method
        @param other - The point to compare with.
        @returns true if the point coordinates match; false otherwise.
        */
        equals(other: kendo.geometry.Point): boolean;
        /**
        Gets the x coordinate value.
        @method
        @returns The current x coordinate value.
        */
        getX(): number;
        /**
        Gets the y coordinate value.
        @method
        @returns The current y coordinate value.
        */
        getY(): number;
        /**
        Moves the point to the specified x and y coordinates.
        @method
        @param x - The new X coordinate.
        @param y - The new Y coordinate.
        @returns The current point instance.
        */
        move(x: number, y: number): kendo.geometry.Point;
        /**
        Rotates the point around the given center.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The rotation center. Can be a Point instance or an [x, y] array.
        @returns The current Point instance.
        */
        rotate(angle: number, center: kendo.geometry.Point): kendo.geometry.Point;
        /**
        Rotates the point around the given center.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The rotation center. Can be a Point instance or an [x, y] array.
        @returns The current Point instance.
        */
        rotate(angle: number, center: any): kendo.geometry.Point;
        /**
        Rounds the point coordinates to the specified number of fractional digits.
        @method
        @param digits - Number of fractional digits.
        @returns The current Point instance.
        */
        round(digits: number): kendo.geometry.Point;
        /**
        Scales the point coordinates along the x and y axis.
        @method
        @param scaleX - The x scale multiplier.
        @param scaleY - The y scale multiplier.
        @returns The current point instance.
        */
        scale(scaleX: number, scaleY: number): kendo.geometry.Point;
        /**
        Scales the point coordinates on a copy of the current point.
The callee coordinates will remain unchanged.
        @method
        @param scaleX - The x scale multiplier.
        @param scaleY - The y scale multiplier.
        @returns The new Point instance.
        */
        scaleCopy(scaleX: number, scaleY: number): kendo.geometry.Point;
        /**
        Sets the x coordinate to a new value.
        @method
        @param value - The new x coordinate value.
        @returns The current Point instance.
        */
        setX(value: number): kendo.geometry.Point;
        /**
        Sets the y coordinate to a new value.
        @method
        @param value - The new y coordinate value.
        @returns The current Point instance.
        */
        setY(value: number): kendo.geometry.Point;
        /**
        Returns the point coordinates as an [x, y] array.
        @method
        @param digits - (Optional) Number of fractional digits.
        @returns An array representation of the point, e.g. [10, 20]
        */
        toArray(digits: number): any;
        /**
        Formats the point value to a string.
        @method
        @param digits - (Optional) Number of fractional digits.
        @param separator - The separator to place between coordinates.
        @returns A string representation of the point, e.g. "10 20".
        */
        toString(digits: number, separator: string): string;
        /**
        Applies a transformation to the point coordinates.
The current coordinates will be overriden.
        @method
        @param tansformation - The transformation to apply.
        @returns The current Point instance.
        */
        transform(tansformation: kendo.geometry.Transformation): kendo.geometry.Point;
        /**
        Applies a transformation on a copy of the current point.
The callee coordinates will remain unchanged.
        @method
        @param tansformation - The transformation to apply.
        @returns The new Point instance.
        */
        transformCopy(tansformation: kendo.geometry.Transformation): kendo.geometry.Point;
        /**
        Translates the point along the x and y axis.
        @method
        @param dx - The distance to move along the X axis.
        @param dy - The distance to move along the Y axis.
        @returns The current point instance.
        */
        translate(dx: number, dy: number): kendo.geometry.Point;
        /**
        Translates the point by using a Point instance as a vector of translation.
        @method
        @param vector - The vector of translation. Can be either a Point instance or an [x, y] array.
        @returns The current point instance.
        */
        translateWith(vector: kendo.geometry.Point): kendo.geometry.Point;
        /**
        Translates the point by using a Point instance as a vector of translation.
        @method
        @param vector - The vector of translation. Can be either a Point instance or an [x, y] array.
        @returns The current point instance.
        */
        translateWith(vector: any): kendo.geometry.Point;

    }

    interface PointOptions {
        name?: string;
    }
    interface PointEvent {
        sender: Point;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Rect extends Observable {


        options: RectOptions;

        /**
                The origin (top-left corner) of the rectangle.
                */
                origin: kendo.geometry.Point;
        /**
                The size of the rectangle.
                */
                size: kendo.geometry.Size;

        constructor(origin: kendo.geometry.Point, size: kendo.geometry.Size);

        static fromPoints(pointA: kendo.geometry.Point, pointB: kendo.geometry.Point): kendo.geometry.Rect;
        static union(rectA: kendo.geometry.Rect, rectB: kendo.geometry.Rect): kendo.geometry.Rect;

        /**
        Returns the bounding box of this rectangle after applying the
specified transformation matrix.
        @method
        @param matrix - Transformation matrix to apply.
        @returns The bounding box after applying the transformation matrix.
        */
        bbox(matrix: kendo.geometry.Matrix): kendo.geometry.Rect;
        /**
        Gets the position of the bottom-left corner of the rectangle.
This is also the rectangle origin
        @method
        @returns The position of the bottom-left corner.
        */
        bottomLeft(): kendo.geometry.Point;
        /**
        Gets the position of the bottom-right corner of the rectangle.
        @method
        @returns The position of the bottom-right corner.
        */
        bottomRight(): kendo.geometry.Point;
        /**
        Gets the position of the center of the rectangle.
        @method
        @returns The position of the center.
        */
        center(): kendo.geometry.Point;
        /**
        Creates a new instance with the same origin and size.
        @method
        @returns A new Rect instance with the same origin and size.
        */
        clone(): kendo.geometry.Rect;
        /**
        Compares this rectangle with another instance.
        @method
        @param other - The rectangle to compare with.
        @returns true if the origin and size is the same for both rectangles; false otherwise.
        */
        equals(other: kendo.geometry.Rect): boolean;
        /**
        Gets the origin (top-left point) of the rectangle.
        @method
        @returns The origin (top-left point).
        */
        getOrigin(): kendo.geometry.Point;
        /**
        Gets the rectangle size.
        @method
        @returns The current rectangle Size.
        */
        getSize(): kendo.geometry.Size;
        /**
        Gets the rectangle height.
        @method
        @returns The rectangle height.
        */
        height(): number;
        /**
        Sets the origin (top-left point) of the rectangle.
        @method
        @param value - The new origin Point or equivalent [x, y] array.
        @returns The current rectangle instance.
        */
        setOrigin(value: kendo.geometry.Point): kendo.geometry.Rect;
        /**
        Sets the origin (top-left point) of the rectangle.
        @method
        @param value - The new origin Point or equivalent [x, y] array.
        @returns The current rectangle instance.
        */
        setOrigin(value: any): kendo.geometry.Rect;
        /**
        Sets the rectangle size.
        @method
        @param value - The new rectangle Size or equivalent [width, height] array.
        @returns The current rectangle instance.
        */
        setSize(value: kendo.geometry.Size): kendo.geometry.Rect;
        /**
        Sets the rectangle size.
        @method
        @param value - The new rectangle Size or equivalent [width, height] array.
        @returns The current rectangle instance.
        */
        setSize(value: any): kendo.geometry.Rect;
        /**
        Gets the position of the top-left corner of the rectangle.
This is also the rectangle origin
        @method
        @returns The position of the top-left corner.
        */
        topLeft(): kendo.geometry.Point;
        /**
        Gets the position of the top-right corner of the rectangle.
        @method
        @returns The position of the top-right corner.
        */
        topRight(): kendo.geometry.Point;
        /**
        Gets the rectangle width.
        @method
        @returns The rectangle width.
        */
        width(): number;

    }

    interface RectOptions {
        name?: string;
    }
    interface RectEvent {
        sender: Rect;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Size extends Observable {


        options: SizeOptions;

        /**
                The horizontal size.
                */
                width: number;
        /**
                The vertical size.
                */
                height: number;


        static create(width: number, height: number): kendo.geometry.Size;
        static create(width: any, height: number): kendo.geometry.Size;
        static create(width: kendo.geometry.Size, height: number): kendo.geometry.Size;

        /**
        Creates a new instance with the same width and height.
        @method
        @returns A new Size instance with the same coordinates.
        */
        clone(): kendo.geometry.Size;
        /**
        Compares this Size with another instance.
        @method
        @param other - The Size to compare with.
        @returns true if the size members match; false otherwise.
        */
        equals(other: kendo.geometry.Size): boolean;
        /**
        Gets the width value.
        @method
        @returns The current width value.
        */
        getWidth(): number;
        /**
        Gets the height value.
        @method
        @returns The current height value.
        */
        getHeight(): number;
        /**
        Sets the width to a new value.
        @method
        @param value - The new width value.
        @returns The current Size instance.
        */
        setWidth(value: number): kendo.geometry.Size;
        /**
        Sets the height to a new value.
        @method
        @param value - The new height value.
        @returns The current Size instance.
        */
        setHeight(value: number): kendo.geometry.Size;

    }

    interface SizeOptions {
        name?: string;
    }
    interface SizeEvent {
        sender: Size;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Transformation extends Observable {


        options: TransformationOptions;




        /**
        Creates a new instance with the same transformation matrix.
        @method
        @returns A new Transformation instance with the same matrix.
        */
        clone(): kendo.geometry.Transformation;
        /**
        Compares this transformation with another instance.
        @method
        @param other - The transformation to compare with.
        @returns true if the transformation matrix is the same; false otherwise.
        */
        equals(other: kendo.geometry.Transformation): boolean;
        /**
        Gets the current transformation matrix for this transformation.
        @method
        @returns The current transformation matrix.
        */
        matrix(): kendo.geometry.Matrix;
        /**
        Multiplies the transformation with another.
The underlying transformation matrix is updated in-place.
        @method
        @param transformation - The transformation to multiply by.
        @returns The current transformation instance.
        */
        multiply(transformation: kendo.geometry.Transformation): kendo.geometry.Transformation;
        /**
        Sets rotation with the specified parameters.
        @method
        @param angle - The angle of rotation in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The center of rotation.
        @returns The current transformation instance.
        */
        rotate(angle: number, center: any): kendo.geometry.Transformation;
        /**
        Sets rotation with the specified parameters.
        @method
        @param angle - The angle of rotation in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The center of rotation.
        @returns The current transformation instance.
        */
        rotate(angle: number, center: kendo.geometry.Point): kendo.geometry.Transformation;
        /**
        Sets scale with the specified parameters.
        @method
        @param scaleX - The scale factor on the X axis.
        @param scaleY - The scale factor on the Y axis.
        @returns The current transformation instance.
        */
        scale(scaleX: number, scaleY: number): kendo.geometry.Transformation;
        /**
        Sets translation with the specified parameters.
        @method
        @param x - The distance to translate along the X axis.
        @param y - The distance to translate along the Y axis.
        @returns The current transformation instance.
        */
        translate(x: number, y: number): kendo.geometry.Transformation;

    }

    interface TransformationOptions {
        name?: string;
    }
    interface TransformationEvent {
        sender: Transformation;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


}
declare module kendo {
    class Color extends Observable {


        options: ColorOptions;




        /**
        Computes the relative luminance between two colors.
        @method
        @returns The relative luminance.
        */
        diff(): number;
        /**
        Compares two color objects for equality.
        @method
        @returns returns true if the two colors are the same. Otherwise, false
        */
        equals(): boolean;
        /**
        Returns the color in HSV representation.  As HSV object, it has the
following properties:This does not modify the current object, it creates a new one instead.
        @method
        @returns An object with h, s, v and a fields.
        */
        toHSV(): any;
        /**
        Returns the color in RGB representation.  The result has the following
properties:This does not modify the current object, it creates a new one instead.
        @method
        @returns An object with r, g, b and a fields.
        */
        toRGB(): any;
        /**
        Returns the color in "Bytes" representation.  It has the same properties as
RGB, but r, g and b are integers between 0 and 255 instead of floats.This does not modify the current object, it creates a new one instead.
        @method
        @returns An object with r, g and b fields.
        */
        toBytes(): any;
        /**
        Returns a string in "FF0000" form (without a leading #).
        @method
        @returns The color in hex notation.
        */
        toHex(): string;
        /**
        Like toHex, but includes a leading #.
        @method
        @returns The color in CSS notation.
        */
        toCss(): string;
        /**
        Returns the color in RGBA notation (includes the opacity).
        @method
        @returns The color in RGBA notation.
        */
        toCssRgba(): string;
        /**
        Returns the color in the best notation supported by the current browser.  In
IE < 9 this returns the #FF0000 form; in all other browsers it returns the
RGBA form.
        @method
        @returns The color in the best notation supported by the current browser.
        */
        toDisplay(): string;

    }

    interface ColorOptions {
        name?: string;
    }
    interface ColorEvent {
        sender: Color;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    module drawing {
        function /**
        Aligns drawing elements x axis position to a given rectangle.
        @method
        @param elements - An array with the drawing elements that should be aligned.
        @param rect - The rectangle in which the elements should be aligned.
        @param alignment - Specifies how should the elements be aligned. The supported values are:
        */
        align(elements: any, rect: kendo.geometry.Rect, alignment: string): void;
        function /**
        Converts the given DOM element to a Drawing API scene.The operation is asynchronous and returns a promise.The promise will be resolved with the root Group of the scene.
        @method
        @param element - The root DOM element to draw.
        @param options - Configuration options
        @returns A promise that will be resolved with the root Group of the scene.
        */
        drawDOM(element: JQuery, options: any): JQueryPromise<any>;
        function /**
        Exports a group of drawing elements as an image.The group will be positioned at [0, 0] in the exported image. It's dimensions will be used as default dimensions for the image.The export operation is asynchronous and returns a promise.The promise will be resolved with a PNG image encoded as a Data URI.
        @method
        @param group - The root group containing all elements to export.
        @param options - Parameters for the exported image.
        @returns A promise that will be resolved with a PNG image encoded as a Data URI.
        */
        exportImage(group: kendo.drawing.Group, options: any): JQueryPromise<any>;
        function /**
        Exports a group of drawing elements as a PDF file.The group will be positioned at [0, 0] in the exported file. It's dimensions will be used as default dimensions for the image.The export operation is asynchronous and returns a promise.The promise will be resolved with a PDF file encoded as a Data URI.
        @method
        @param group - The root group containing all elements to export.
        @param options - Parameters for the exported PDF file.
        @returns A promise that will be resolved with a PDF file encoded as a Data URI.
        */
        exportPDF(group: kendo.drawing.Group, options: kendo.drawing.PDFOptions): JQueryPromise<any>;
        function /**
        Exports a group of drawing elements as an SVG document.The group will be positioned at [0, 0] in the exported file. It's dimensions will be used as default dimensions for the image.The export operation is asynchronous and returns a promise.The promise will be resolved with a SVG document encoded as a Data URI.
        @method
        @param group - The root group containing all elements to export.
        @param options - Export options.
        @returns A promise that will be resolved with a SVG document encoded as a Data URI.
        */
        exportSVG(group: kendo.drawing.Group, options: any): JQueryPromise<any>;
        function /**
        Scales uniformly an element so that it fits in a given rectangle. No scaling will be applied if the element is already small enough to fit in the rectangle.
        @method
        @param element - The drawing element that should be fitted.
        @param rect - The rectangle in which the elements should be fitted.
        */
        fit(element: kendo.drawing.Element, rect: kendo.geometry.Rect): void;
        function /**
        Stacks drawing elements horizontally.
        @method
        @param elements - An array with the drawing elements that should be stacked.
        */
        stack(elements: any): void;
        function /**
        Aligns drawing elements y axis position to a given rectangle.
        @method
        @param elements - An array with the drawing elements that should be aligned.
        @param rect - The rectangle in which the elements should be aligned.
        @param alignment - Specifies how should the elements be aligned. The supported values are:
        */
        vAlign(elements: any, rect: kendo.geometry.Rect, alignment: string): void;
        function /**
        Stacks drawing elements vertically.
        @method
        @param elements - An array with the drawing elements that should be stacked.
        */
        vStack(elements: any): void;
        function /**
        Stacks drawing elements vertically. Multiple stacks will be used if the elements height exceeds the given rectangle height.
        @method
        @param elements - An array with the drawing elements that should be wrapped.
        @param rect - The rectangle in which the elements should be wrapped.
        @returns An array with the stacks. Each stack is an Array holding the stack drawing elements.
        */
        vWrap(elements: any, rect: kendo.geometry.Rect): any;
        function /**
        Stacks drawing elements horizontally. Multiple stacks will be used if the elements width exceeds the given rectangle width.
        @method
        @param elements - An array with the drawing elements that should be wrapped.
        @param rect - The rectangle in which the elements should be wrapped.
        @returns An array with the stacks. Each stack is an Array holding the stack drawing elements.
        */
        wrap(elements: any, rect: kendo.geometry.Rect): any;
    }

    module effects {
        function /**
        Calculates the offset and dimensions of the given element
        @method
        @param element - The element to calculate dimensions for.
        @returns An object with top, left, width and height fields in pixels.
        */
        box(element: HTMLElement): any;
        function /**
        Determines the fill scale factor based on two elements' boxes.
        @method
        @param firstElement - The first element.
        @param secondElement - The second element.
        @returns The fill scale for the two elements.
        */
        fillScale(firstElement: HTMLElement, secondElement: HTMLElement): number;
        function /**
        Determines the fit scale factor based on two elements' boxes.
        @method
        @param firstElement - The first element.
        @param secondElement - The second element.
        @returns The fit scale for the two elements.
        */
        fitScale(firstElement: HTMLElement, secondElement: HTMLElement): number;
        function /**
        Determines the transform origin point based on two elements' boxes. The method is primarily used in zoom/transfer effects.
        @method
        @param firstElement - The first element.
        @param secondElement - The second element.
        @returns An object with x and y fields that represent the transform origin point.
        */
        transformOrigin(firstElement: HTMLElement, secondElement: HTMLElement): any;
    }

        function /**
        Returns an object that contains common
CSRF tokens
found on the page.These include tokens used by ASP.NET, Ruby on Rails and others.
        @method
        @returns An object that contains common CSRF tokens found on the page
        */
        antiForgeryTokens(): any;
        function /**
        Binds a HTML View to a View-Model and initializes Kendo UI widgets from DOM elements based on data-role attributes, similar to kendo.init().Model View ViewModel (MVVM) is a design pattern which helps developers separate the Model from the View. The View-Model part of MVVM is responsible for
exposing the data objects from the Model in such a way that those objects are easily consumed in the View.
        @method
        @param element - The root element(s) from which the binding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        @param viewModel - The View-Model which the elements are bound to. Wrapped as an instance of kendo.data.ObservableObject if not already.
        @param namespace - Optional namespace to look in when instantiating Kendo UI widgets. The valid namespaces are kendo.ui, kendo.dataviz.ui and kendo.mobile.ui. If omitted
kendo.ui will be used. Multiple namespaces can be passed.
        */
        bind(element: string, viewModel: any, namespace?: any): void;
        function /**
        Binds a HTML View to a View-Model and initializes Kendo UI widgets from DOM elements based on data-role attributes, similar to kendo.init().Model View ViewModel (MVVM) is a design pattern which helps developers separate the Model from the View. The View-Model part of MVVM is responsible for
exposing the data objects from the Model in such a way that those objects are easily consumed in the View.
        @method
        @param element - The root element(s) from which the binding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        @param viewModel - The View-Model which the elements are bound to. Wrapped as an instance of kendo.data.ObservableObject if not already.
        @param namespace - Optional namespace to look in when instantiating Kendo UI widgets. The valid namespaces are kendo.ui, kendo.dataviz.ui and kendo.mobile.ui. If omitted
kendo.ui will be used. Multiple namespaces can be passed.
        */
        bind(element: string, viewModel: kendo.data.ObservableObject, namespace?: any): void;
        function /**
        Binds a HTML View to a View-Model and initializes Kendo UI widgets from DOM elements based on data-role attributes, similar to kendo.init().Model View ViewModel (MVVM) is a design pattern which helps developers separate the Model from the View. The View-Model part of MVVM is responsible for
exposing the data objects from the Model in such a way that those objects are easily consumed in the View.
        @method
        @param element - The root element(s) from which the binding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        @param viewModel - The View-Model which the elements are bound to. Wrapped as an instance of kendo.data.ObservableObject if not already.
        @param namespace - Optional namespace to look in when instantiating Kendo UI widgets. The valid namespaces are kendo.ui, kendo.dataviz.ui and kendo.mobile.ui. If omitted
kendo.ui will be used. Multiple namespaces can be passed.
        */
        bind(element: JQuery, viewModel: any, namespace?: any): void;
        function /**
        Binds a HTML View to a View-Model and initializes Kendo UI widgets from DOM elements based on data-role attributes, similar to kendo.init().Model View ViewModel (MVVM) is a design pattern which helps developers separate the Model from the View. The View-Model part of MVVM is responsible for
exposing the data objects from the Model in such a way that those objects are easily consumed in the View.
        @method
        @param element - The root element(s) from which the binding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        @param viewModel - The View-Model which the elements are bound to. Wrapped as an instance of kendo.data.ObservableObject if not already.
        @param namespace - Optional namespace to look in when instantiating Kendo UI widgets. The valid namespaces are kendo.ui, kendo.dataviz.ui and kendo.mobile.ui. If omitted
kendo.ui will be used. Multiple namespaces can be passed.
        */
        bind(element: JQuery, viewModel: kendo.data.ObservableObject, namespace?: any): void;
        function /**
        Binds a HTML View to a View-Model and initializes Kendo UI widgets from DOM elements based on data-role attributes, similar to kendo.init().Model View ViewModel (MVVM) is a design pattern which helps developers separate the Model from the View. The View-Model part of MVVM is responsible for
exposing the data objects from the Model in such a way that those objects are easily consumed in the View.
        @method
        @param element - The root element(s) from which the binding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        @param viewModel - The View-Model which the elements are bound to. Wrapped as an instance of kendo.data.ObservableObject if not already.
        @param namespace - Optional namespace to look in when instantiating Kendo UI widgets. The valid namespaces are kendo.ui, kendo.dataviz.ui and kendo.mobile.ui. If omitted
kendo.ui will be used. Multiple namespaces can be passed.
        */
        bind(element: Element, viewModel: any, namespace?: any): void;
        function /**
        Binds a HTML View to a View-Model and initializes Kendo UI widgets from DOM elements based on data-role attributes, similar to kendo.init().Model View ViewModel (MVVM) is a design pattern which helps developers separate the Model from the View. The View-Model part of MVVM is responsible for
exposing the data objects from the Model in such a way that those objects are easily consumed in the View.
        @method
        @param element - The root element(s) from which the binding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        @param viewModel - The View-Model which the elements are bound to. Wrapped as an instance of kendo.data.ObservableObject if not already.
        @param namespace - Optional namespace to look in when instantiating Kendo UI widgets. The valid namespaces are kendo.ui, kendo.dataviz.ui and kendo.mobile.ui. If omitted
kendo.ui will be used. Multiple namespaces can be passed.
        */
        bind(element: Element, viewModel: kendo.data.ObservableObject, namespace?: any): void;
        function /**
        Creates an ObservableArray instance that is bound to a HierarchicalDataSource. Required to bind a HierarchicalDataSource-enabled widget (such as the Kendo UI TreeView) to a view-model.
        @method
        @param array - The array that will be converted to an ObservableArray.
        */
        observableHierarchy(array: any): void;
        function /**
        Sets or gets the current culture. Uses the passed culture name to select a culture from the culture scripts that you have included and then sets the current culture.
If there is no corresponding culture then the method will try to find culture which is equal to the country part of the culture name.
If no culture is found the default one is used.
        @method
        @param culture - The culture to set.
        */
        culture(culture: string): void;
        function /**
        Finds all Kendo widgets that are children of the specified element and calls their destroy method.
        @method
        @param element - 
        */
        destroy(element: string): void;
        function /**
        Finds all Kendo widgets that are children of the specified element and calls their destroy method.
        @method
        @param element - 
        */
        destroy(element: JQuery): void;
        function /**
        Finds all Kendo widgets that are children of the specified element and calls their destroy method.
        @method
        @param element - 
        */
        destroy(element: Element): void;
        function /**
        Encodes HTML characters to entities.
        @method
        @param value - The string that needs to be HTML encoded.
        @returns The encoded string.
        */
        htmlEncode(value: string): string;
        function /**
        Parses as a formatted string as a Date. Also see Date Parsing
        @method
        @param value - The string which should be parsed as Date.
        @param formats - The format(s) that will be used to parse the date. By default all standard date formats of the current culture are used.
        @param culture - The culture used to parse the number. The current culture is used by default.
        @returns the parsed date. Returns null if the value cannot be parsed as a valid Date.
        */
        parseDate(value: string, formats?: string, culture?: string): Date;
        function /**
        Parses as a formatted string as a Date. Also see Date Parsing
        @method
        @param value - The string which should be parsed as Date.
        @param formats - The format(s) that will be used to parse the date. By default all standard date formats of the current culture are used.
        @param culture - The culture used to parse the number. The current culture is used by default.
        @returns the parsed date. Returns null if the value cannot be parsed as a valid Date.
        */
        parseDate(value: string, formats?: any, culture?: string): Date;
        function /**
        Parses a string as a floating point number.
        @method
        @param value - The string which should be parsed as a Number.
        @param culture - The culture used to parse the number. The current culture is used by default.
        @returns the parsed number. Returns null if the value cannot be parsed as a valid Number.
        */
        parseFloat(value: string, culture?: string): number;
        function /**
        Parses as a string as an integer.
        @method
        @param value - The string which should be parsed as Number.
        @param culture - The culture used to parse the number. The current culture is used by default.
        @returns the parsed number. Returns null if the value cannot be parsed as a valid Number.
        */
        parseInt(value: string, culture?: string): number;
        function /**
        Parse a color string to a Color object.  If the input is not valid throws an Error, unless the noerror argument is given.
        @method
        @param color - A string in one of the following (case-insensitive) CSS notations:Particularly if this argument is null or the string "transparent" then this function will return null.
        @param noerror - If you pass true then this function will return undefined rather than throwing an error on invalid input.
        @returns A Color object.
        */
        parseColor(color: string, noerror: boolean): kendo.Color;
        function /**
        Creates a wrapper object over the passed one, with get/set properties that set the original object dirty flag. Suitable for a scenario where a dataSource item is used in a third-party MVVM implementation, like AngularJS.
        @method
        */
        proxyModelSetters(): void;
        function /**
        Creates a wrapper object over the passed one, with get/set properties that set the original object dirty flag. Suitable for a scenario where a dataSource item is used in a third-party MVVM implementation, like AngularJS.
        @method
        @param data - The model that will be wrapped.
        */
        proxyModelSetters(data: kendo.data.Model): void;
        function /**
        Finds all Kendo widgets that are children of the specified element and calls their resize method.
        @method
        @param element - 
        @param force - Determines whether the resizing routine should be executed even if the respective widget's outer dimensions have not changed. The parameter will be passed to the widget's resize method.
        */
        resize(element: string, force: boolean): void;
        function /**
        Finds all Kendo widgets that are children of the specified element and calls their resize method.
        @method
        @param element - 
        @param force - Determines whether the resizing routine should be executed even if the respective widget's outer dimensions have not changed. The parameter will be passed to the widget's resize method.
        */
        resize(element: JQuery, force: boolean): void;
        function /**
        Finds all Kendo widgets that are children of the specified element and calls their resize method.
        @method
        @param element - 
        @param force - Determines whether the resizing routine should be executed even if the respective widget's outer dimensions have not changed. The parameter will be passed to the widget's resize method.
        */
        resize(element: Element, force: boolean): void;
        function /**
        Saves a file with the specified name and content.
A server "echo" proxy might be required, depending on browser capabilities.
        @method
        @param options - Configuration options for the save operation.
        */
        saveAs(options: any): void;
        function /**
        Converts a JavaScript object to JSON. Uses JSON.stringify in browsers that support it.
        @method
        @param value - The value to convert to a JSON string.
        @returns The JSON representation of the value.
        */
        stringify(value: any): string;
        function /**
        Limits the number of calls to a function to one for a specified amount of time.
        @method
        @param fn - The function to be throttled.
        @param timeout - The amount of time that needs to pass before a subsequent function call is made.
        */
        throttle(fn: Function, timeout: number): void;
        function /**
        Enables kinetic scrolling on touch devices
        @method
        @param element - The container element to enable scrolling for.
        */
        touchScroller(element: string): void;
        function /**
        Enables kinetic scrolling on touch devices
        @method
        @param element - The container element to enable scrolling for.
        */
        touchScroller(element: JQuery): void;
        function /**
        Enables kinetic scrolling on touch devices
        @method
        @param element - The container element to enable scrolling for.
        */
        touchScroller(element: Element): void;
        function /**
        Formats a Number or Date using the specified format and the current culture.
        @method
        @param value - The Date or Number which should be formatted.
        @param format - The format string which should be used to format the value. Number formatting and date formatting depends on the current culture.
        @param culture - The name of the culture which should be used to format the value. The culture should be registered on the page.
        @returns the string representation of the formatted value.
        */
        toString(value: Date, format: string, culture?: string): string;
        function /**
        Formats a Number or Date using the specified format and the current culture.
        @method
        @param value - The Date or Number which should be formatted.
        @param format - The format string which should be used to format the value. Number formatting and date formatting depends on the current culture.
        @param culture - The name of the culture which should be used to format the value. The culture should be registered on the page.
        @returns the string representation of the formatted value.
        */
        toString(value: number, format: string, culture?: string): string;
        function /**
        Unbinds a tree of HTML elements from a View-Model.
        @method
        @param element - The root element(s) from which the unbinding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        */
        unbind(element: string): void;
        function /**
        Unbinds a tree of HTML elements from a View-Model.
        @method
        @param element - The root element(s) from which the unbinding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        */
        unbind(element: JQuery): void;
        function /**
        Unbinds a tree of HTML elements from a View-Model.
        @method
        @param element - The root element(s) from which the unbinding starts. Can be a valid jQuery string selector, a DOM element or a jQuery object.
All descendant elements are traversed.
        */
        unbind(element: Element): void;

    module pdf {
        function /**
        Defines a map with locations for TrueType Font (.ttf) files.The exportPDF method will use the font files when embedding them in a PDF document.
As a fallback, fonts might be loaded from the locations listed in a style sheet font-face declarations.
This will work only if the style sheet and fonts are loaded from the same domain.It's safe to call this method multiple times.
        @method
        @param map - A map for font names, variants and the location of its .ttf file.
        */
        defineFont(map: any): void;
    }

}
declare module kendo.mobile.ui {
    class ActionSheet extends kendo.mobile.ui.Widget {

        static fn: ActionSheet;

        options: ActionSheetOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): ActionSheet;

        constructor(element: Element, options?: ActionSheetOptions);


        /**
        Close the ActionSheet.
        @method
        */
        close(): void;
        /**
        Prepares the ActionSheet for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Open the ActionSheet.
        @method
        @param target - (optional) The target element of the ActionSheet, available in the callback methods.Notice The target element is mandatory on tablets, as the ActionSheet widget positions itself relative to opening element when a tablet is detected.
        @param context - (optional) The context of the ActionSheet, available in the callback methods.
        */
        open(target: JQuery, context: any): void;

    }

    interface ActionSheetPopup {
        /**
        The direction to which the popup will expand, relative to the target that opened it.
        @member {number|string}
        */
        direction?: number|string;
        /**
        The height of the popup in pixels.
        @member {number|string}
        */
        height?: number|string;
        /**
        The width of the popup in pixels.
        @member {number|string}
        */
        width?: number|string;
    }

    interface ActionSheetOptions {
        name?: string;
        /**
        The text of the cancel button.
        @member {string}
        */
        cancel?: string;
        /**
        The popup configuration options (tablet only).
        @member {ActionSheetPopup}
        */
        popup?: ActionSheetPopup;
        /**
        By default, the actionsheet opens as a full screen dialog on a phone device or as a popover if a tablet is detected. Setting the type to "phone" or "tablet" will force the looks of the widget regardless of the device.
        @member {string}
        */
        type?: string;
        /**
        Fires when the ActionSheet is closed.
        */
        close?(e: ActionSheetEvent): void;
        /**
        Fires when the ActionSheet is opened.
        */
        open?(e: ActionSheetOpenEvent): void;
    }
    interface ActionSheetEvent {
        sender: ActionSheet;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ActionSheetOpenEvent extends ActionSheetEvent {
        /**
        The invocation target of the ActionSheet.
        @member {JQuery}
        */
        target?: JQuery;
        /**
        The defined ActionSheet context.
        @member {JQuery}
        */
        context?: JQuery;
    }


    class BackButton extends kendo.mobile.ui.Widget {

        static fn: BackButton;

        options: BackButtonOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): BackButton;

        constructor(element: Element, options?: BackButtonOptions);


        /**
        Prepares the BackButton for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;

    }

    interface BackButtonOptions {
        name?: string;
        /**
        Fires when the user taps the button.
        */
        click?(e: BackButtonClickEvent): void;
    }
    interface BackButtonEvent {
        sender: BackButton;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface BackButtonClickEvent extends BackButtonEvent {
        /**
        The clicked DOM element
        @member {JQuery}
        */
        target?: JQuery;
        /**
        The button DOM element
        @member {JQuery}
        */
        button?: JQuery;
    }


    class Button extends kendo.mobile.ui.Widget {

        static fn: Button;

        options: ButtonOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Button;

        constructor(element: Element, options?: ButtonOptions);


        /**
        Introduced in Q1 2013 SP Sets a badge on the Button with the specified value. If invoked without parameters, returns the current badge value. Set the value to false to remove the badge.
        @method
        @param value - The target value to be set or false to be removed.
        @returns the badge value if invoked without parameters, otherwise the Button object.
        */
        badge(value: string): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on the Button with the specified value. If invoked without parameters, returns the current badge value. Set the value to false to remove the badge.
        @method
        @param value - The target value to be set or false to be removed.
        @returns the badge value if invoked without parameters, otherwise the Button object.
        */
        badge(value: boolean): string;
        /**
        Prepares the Button for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Changes the enabled state of the widget.
        @method
        @param enable - Whether to enable or disable the widget.
        */
        enable(enable: boolean): void;

    }

    interface ButtonOptions {
        name?: string;
        /**
        The badge of the button.
        @member {string}
        */
        badge?: string;
        /**
        Configures the DOM event used to trigger the button click event/navigate in the mobile application. Can be set to "down" as an alias for touchstart, mousedown, MSPointerDown, and PointerDown vendor specific events.
Setting the clickOn to down usually makes sense for buttons in the header or in non-scrollable views for increased responsiveness.By default, buttons trigger click/navigate when the user taps the button (a press + release action sequence occurs).
        @member {string}
        */
        clickOn?: string;
        /**
        If set to false the widget will be disabled and will not allow the user to click it. The widget is enabled by default.
        @member {boolean}
        */
        enable?: boolean;
        /**
        The icon of the button. It can be either one of the built-in icons, or a custom one.
        @member {string}
        */
        icon?: string;
        /**
        Fires when the user taps the button.
        */
        click?(e: ButtonClickEvent): void;
    }
    interface ButtonEvent {
        sender: Button;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ButtonClickEvent extends ButtonEvent {
        /**
        The clicked DOM element
        @member {JQuery}
        */
        target?: JQuery;
        /**
        The button DOM element
        @member {JQuery}
        */
        button?: JQuery;
    }


    class ButtonGroup extends kendo.mobile.ui.Widget {

        static fn: ButtonGroup;

        options: ButtonGroupOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): ButtonGroup;

        constructor(element: Element, options?: ButtonGroupOptions);


        /**
        Introduced in Q1 2013 SP Sets a badge on one of the ButtonGroup buttons with the specified value. If invoked without parameters, returns the button's current badge value. Set the value to false to remove the badge.
        @method
        @param button - The target button specified either as a jQuery selector/object or as an button index.
        @param value - The target value to be set or false to be removed.
        @returns the badge value if invoked without parameters, otherwise the ButtonGroup object.
        */
        badge(button: string, value: string): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on one of the ButtonGroup buttons with the specified value. If invoked without parameters, returns the button's current badge value. Set the value to false to remove the badge.
        @method
        @param button - The target button specified either as a jQuery selector/object or as an button index.
        @param value - The target value to be set or false to be removed.
        @returns the badge value if invoked without parameters, otherwise the ButtonGroup object.
        */
        badge(button: string, value: boolean): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on one of the ButtonGroup buttons with the specified value. If invoked without parameters, returns the button's current badge value. Set the value to false to remove the badge.
        @method
        @param button - The target button specified either as a jQuery selector/object or as an button index.
        @param value - The target value to be set or false to be removed.
        @returns the badge value if invoked without parameters, otherwise the ButtonGroup object.
        */
        badge(button: number, value: string): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on one of the ButtonGroup buttons with the specified value. If invoked without parameters, returns the button's current badge value. Set the value to false to remove the badge.
        @method
        @param button - The target button specified either as a jQuery selector/object or as an button index.
        @param value - The target value to be set or false to be removed.
        @returns the badge value if invoked without parameters, otherwise the ButtonGroup object.
        */
        badge(button: number, value: boolean): string;
        /**
        Get the currently selected Button.
        @method
        @returns the jQuery object representing the currently selected button.
        */
        current(): JQuery;
        /**
        Prepares the ButtonGroup for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Enables or disables the widget.
        @method
        @param enable - A boolean flag that indicates whether the widget should be enabled or disabled.
        */
        enable(enable: boolean): void;
        /**
        Select a Button.
        @method
        @param li - LI element or index of the Button.
        */
        select(li: JQuery): void;
        /**
        Select a Button.
        @method
        @param li - LI element or index of the Button.
        */
        select(li: number): void;

    }

    interface ButtonGroupOptions {
        name?: string;
        /**
        Defines if the widget is initially enabled or disabled.
        @member {boolean}
        */
        enable?: boolean;
        /**
        Defines the initially selected Button (zero based index).
        @member {number}
        */
        index?: number;
        /**
        Sets the DOM event used to select the button. Accepts "up" as an alias for touchend, mouseup and MSPointerUp vendor specific events.By default, buttons are selected immediately after the user presses the button (on touchstart or mousedown or MSPointerDown, depending on the mobile device).
However, if the widget is placed in a scrollable view, the user may accidentally press the button when scrolling. In such cases, it is recommended to set this option to "up".
        @member {string}
        */
        selectOn?: string;
        /**
        Fires when a Button is selected.
        */
        select?(e: ButtonGroupSelectEvent): void;
    }
    interface ButtonGroupEvent {
        sender: ButtonGroup;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ButtonGroupSelectEvent extends ButtonGroupEvent {
        /**
        The index of the selected button
        @member {number}
        */
        index?: number;
    }


    class Collapsible extends kendo.mobile.ui.Widget {

        static fn: Collapsible;

        options: CollapsibleOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Collapsible;

        constructor(element: Element, options?: CollapsibleOptions);


        /**
        Collapses the content.
        @method
        @param instant - Optional. When set to true the collapse action will be performed without animation.
        */
        collapse(instant: boolean): void;
        /**
        Prepares the Collapsible for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Expands the content.
        @method
        @param instant - When set to true the expand action will be performed without animation.
        */
        expand(instant?: boolean): void;
        /**
        Recalculates the content height.
        @method
        */
        resize(): void;
        /**
        Toggles the content visibility.
        @method
        @param instant - When set to true the expand/collapse action will be performed without animation.
        */
        toggle(instant?: boolean): void;

    }

    interface CollapsibleOptions {
        name?: string;
        /**
        Turns on or off the animation of the widget.
        @member {boolean}
        */
        animation?: boolean;
        /**
        If set to false the widget content will be expanded initially. The content of the widget is collapsed by default.
        @member {boolean}
        */
        collapsed?: boolean;
        /**
        Sets the icon for the header of the collapsible widget when it is in a expanded state.
        @member {string}
        */
        expandIcon?: string;
        /**
        Sets the icon position in the header of the collapsible widget. Possible values are "left", "right", "top".
        @member {string}
        */
        iconPosition?: string;
        /**
        Forses inset appearance - the collapsible panel is padded from the View and receives rounded corners.
        @member {boolean}
        */
        inset?: boolean;
        /**
        Fires when the user collapses the content.
        */
        collapse?(e: CollapsibleEvent): void;
        /**
        Fires when the user expands the content.
        */
        expand?(e: CollapsibleEvent): void;
    }
    interface CollapsibleEvent {
        sender: Collapsible;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class DetailButton extends kendo.mobile.ui.Widget {

        static fn: DetailButton;

        options: DetailButtonOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): DetailButton;

        constructor(element: Element, options?: DetailButtonOptions);


        /**
        Prepares the DetailButton for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;

    }

    interface DetailButtonOptions {
        name?: string;
        /**
        Fires when the user taps the button.
        */
        click?(e: DetailButtonClickEvent): void;
    }
    interface DetailButtonEvent {
        sender: DetailButton;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface DetailButtonClickEvent extends DetailButtonEvent {
        /**
        The clicked DOM element
        @member {JQuery}
        */
        target?: JQuery;
        /**
        The button DOM element
        @member {JQuery}
        */
        button?: JQuery;
    }


    class Drawer extends kendo.mobile.ui.Widget {

        static fn: Drawer;

        options: DrawerOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Drawer;

        constructor(element: Element, options?: DrawerOptions);


        /**
        Prepares the Drawer for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Hide the Drawer
        @method
        */
        hide(): void;
        /**
        Show the Drawer
        @method
        */
        show(): void;

    }

    interface DrawerOptions {
        name?: string;
        /**
        Specifies the content element to shift when the drawer appears. Required if the drawer is used outside of a mobile application.
        @member {JQuery}
        */
        container?: JQuery;
        /**
        The position of the drawer. Can be left (default) or right.
        @member {string}
        */
        position?: string;
        /**
        If set to false, swiping the view will not activate the drawer. In this case, the drawer will only be open by a designated button
        @member {boolean}
        */
        swipeToOpen?: boolean;
        /**
        A list of the view ids on which the drawer will appear when the view is swiped. If omitted, the swipe gesture will work on all views.
The option has effect only if swipeToOpen is set to true.
        @member {any}
        */
        swipeToOpenViews?: any;
        /**
        The text to display in the Navbar title (if present).
        @member {string}
        */
        title?: string;
        /**
        A list of the view ids on which the drawer will appear. If omitted, the drawer will work on any view in the application.
        @member {any}
        */
        views?: any;
        /**
        Fired after the mobile Drawer has been hidden.
        */
        afterHide?(e: DrawerAfterHideEvent): void;
        /**
        Fires before the mobile Drawer is revealed. The event can be prevented by calling the preventDefault method of the event parameter.
        */
        beforeShow?(e: DrawerEvent): void;
        /**
        Fired when the mobile Drawer is closed by the user.
        */
        hide?(e: DrawerHideEvent): void;
        /**
        Fired when the mobile Drawer and its child widgets are initialized.
        */
        init?(e: DrawerInitEvent): void;
        /**
        Fires when the Drawer is shown.
        */
        show?(e: DrawerShowEvent): void;
    }
    interface DrawerEvent {
        sender: Drawer;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface DrawerAfterHideEvent extends DrawerEvent {
    }

    interface DrawerHideEvent extends DrawerEvent {
    }

    interface DrawerInitEvent extends DrawerEvent {
    }

    interface DrawerShowEvent extends DrawerEvent {
    }


    class Layout extends kendo.mobile.ui.Widget {

        static fn: Layout;

        options: LayoutOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Layout;

        constructor(element: Element, options?: LayoutOptions);



    }

    interface LayoutOptions {
        name?: string;
        /**
        The id of the layout. Required
        @member {string}
        */
        id?: string;
        /**
        The specific platform this layout targets. By default, layouts are displayed
on all platforms.
        @member {string}
        */
        platform?: string;
        /**
        Fires when a mobile View using the layout becomes hidden.
        */
        hide?(e: LayoutHideEvent): void;
        /**
        Fires after a mobile Layout and its child widgets is initialized.
        */
        init?(e: LayoutInitEvent): void;
        /**
        Fires when a mobile View using the layout becomes visible.
        */
        show?(e: LayoutShowEvent): void;
    }
    interface LayoutEvent {
        sender: Layout;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface LayoutHideEvent extends LayoutEvent {
        /**
        The mobile layout instance
        @member {JQuery}
        */
        layout?: JQuery;
        /**
        The mobile view instance
        @member {JQuery}
        */
        view?: JQuery;
    }

    interface LayoutInitEvent extends LayoutEvent {
        /**
        The mobile layout instance
        @member {JQuery}
        */
        layout?: JQuery;
    }

    interface LayoutShowEvent extends LayoutEvent {
        /**
        The mobile layout instance
        @member {JQuery}
        */
        layout?: JQuery;
        /**
        The mobile view instance
        @member {JQuery}
        */
        view?: JQuery;
    }


    class ListView extends kendo.mobile.ui.Widget {

        static fn: ListView;

        options: ListViewOptions;

        dataSource: kendo.data.DataSource;

        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): ListView;

        constructor(element: Element, options?: ListViewOptions);


        /**
        Appends new items generated by rendering the given data items with the listview template to the bottom of the listview.
        @method
        @param dataItems - 
        */
        append(dataItems: any): void;
        /**
        Prepends new items generated by rendering the given data items with the listview template to the top of the listview.
        @method
        @param dataItems - 
        */
        prepend(dataItems: any): void;
        /**
        Replaces the contents of the listview with the passed rendered data items.
        @method
        @param dataItems - 
        */
        replace(dataItems: any): void;
        /**
        Removes the listview items which are rendered with the passed data items.
        @method
        @param dataItems - 
        */
        remove(dataItems: any): void;
        /**
        Re-renders the given listview item with the new dataItem provided. In order for the method to work as expected, the data items should be of type kendo.data.Model.
        @method
        @param item - The listview item to update
        @param dataItem - The new dataItem
        */
        setDataItem(item: JQuery, dataItem: kendo.data.Model): void;
        /**
        Prepares the ListView for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Get the listview DOM element items
        @method
        @returns The listview DOM element items
        */
        items(): JQuery;
        /**
        Repaints the listview (works only in databound mode).
        @method
        */
        refresh(): void;
        /**
        Sets the DataSource of an existing ListView and rebinds it.
        @method
        @param dataSource - 
        */
        setDataSource(dataSource: kendo.data.DataSource): void;

    }

    interface ListViewFilterable {
        /**
        Placeholder text for search input.
        @member {string}
        */
        placeholder?: string;
        /**
        Indicates whether filtering should be performed on every key up event or when the focus is moved out of the filter input.
        @member {boolean}
        */
        autoFilter?: boolean;
        /**
        Specifies the field which will be used in the filter expression. The default field value is undefined which is usefull when the list view is bound to a list of primitive types.
If this is not case the field must be defined.
        @member {string}
        */
        field?: string;
        /**
        Specifies whether the filter expression must be case sensitive or not.
        @member {boolean}
        */
        ignoreCase?: boolean;
        /**
        Specifies the comparison operator used in the filter expression. The operator must be one of the available DataSource filter operators.
        @member {string}
        */
        operator?: string;
    }

    interface ListViewMessages {
        /**
        The text of the rendered load-more button (applies only if loadMore is set to true).
        @member {string}
        */
        loadMoreText?: string;
        /**
        Text that appears when scroller is pulled (applies only if pullToRefresh is set to true).
        @member {string}
        */
        pullTemplate?: string;
        /**
        Text that appears when ListView is refreshing (applies only if pullToRefresh is set to true).
        @member {string}
        */
        refreshTemplate?: string;
        /**
        Text that appears when scroller is pulled beyound the threshold (applies only if pullToRefresh is set to true).
        @member {string}
        */
        releaseTemplate?: string;
    }

    interface ListViewOptions {
        name?: string;
        /**
        Used in combination with pullToRefresh. If set to true, newly loaded data will be appended on top when refreshing. Notice: not applicable if ListView is in a virtual mode.
        @member {boolean}
        */
        appendOnRefresh?: boolean;
        /**
        Indicates whether the listview will call read on the DataSource initially. If set to false, the listview will be bound after the DataSource instance fetch method is called.
        @member {boolean}
        */
        autoBind?: boolean;
        /**
        Instance of DataSource or the data that the mobile ListView will be bound to.
        @member {kendo.data.DataSource|any}
        */
        dataSource?: kendo.data.DataSource|any;
        /**
        If set to true, the listview gets the next page of data when the user scrolls near the bottom of the view.
        @member {boolean}
        */
        endlessScroll?: boolean;
        /**
        If set to true, the group headers will persist their position when the user scrolls through the listview.
Applicable only when the type is set to group, or when binding to grouped DataSource.Notice: fixed headers are not supported in virtual mode.
        @member {boolean}
        */
        fixedHeaders?: boolean;
        /**
        The header item template (applicable when the type is set to group).
        @member {string|Function}
        */
        headerTemplate?: string|Function;
        /**
        If set to true, a button is rendered at the bottom of the listview. Tapping it fetches and displays the items from the next page of the DataSource.
        @member {boolean}
        */
        loadMore?: boolean;
        /**
        Defines the text of the ListView messages. Used primary for localization.
        @member {ListViewMessages}
        */
        messages?: ListViewMessages;
        /**
        If set to true, the listview will reload its data when the user pulls the view over the top limit.
        @member {boolean}
        */
        pullToRefresh?: boolean;
        /**
        A callback function used when the 'pullToRefresh' option is enabled. The result of the function will be send as additional parameters to the DataSource's next method.Notice: When the listview is in a virtual mode, the pull to refresh action removes the previously loaded items in the listview (instead of appending new records at the top).
Previously loaded pages in the DataSource are also discarded.
        @member {Function}
        */
        pullParameters?: Function;
        /**
        The style of the widget. Can be either empty string(""), or inset.
        @member {string}
        */
        style?: string;
        /**
        The item template.
        @member {string|Function}
        */
        template?: string|Function;
        /**
        The type of the control. Can be either flat (default) or group. Determined automatically in databound mode.
        @member {string}
        */
        type?: string;
        /**
        Indicates whether the filter input must be visible or not.
        @member {ListViewFilterable}
        */
        filterable?: ListViewFilterable;
        /**
        Used when virtualization of local data is used. This configuration is needed to determine the items displayed, since the datasource does not (and should not) have paging set.
        @member {number}
        */
        virtualViewSize?: number;
        /**
        Fires when item is tapped.
        */
        click?(e: ListViewClickEvent): void;
        /**
        Fires when the ListView has received data from the DataSource.
        */
        dataBound?(e: ListViewEvent): void;
        /**
        Fires when the ListView is about to be rendered.
        */
        dataBinding?(e: ListViewEvent): void;
        /**
        Fires when a new item is added to the listview (usually in virtual mode).
        */
        itemChange?(e: ListViewEvent): void;
    }
    interface ListViewEvent {
        sender: ListView;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ListViewClickEvent extends ListViewEvent {
        /**
        The selected list item.
        @member {JQuery}
        */
        item?: JQuery;
        /**
        The tapped DOM element.
        @member {JQuery}
        */
        target?: JQuery;
        /**
        The corresponding dataItem associated with the item (available in databound mode only).
Note: The dataItem must be from a non-primitive type (Object).
        @member {any}
        */
        dataItem?: any;
        /**
        The tapped Kendo mobile Button (if present).
        @member {kendo.mobile.ui.Button}
        */
        button?: kendo.mobile.ui.Button;
    }


    class Loader extends kendo.mobile.ui.Widget {

        static fn: Loader;

        options: LoaderOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Loader;

        constructor(element: Element, options?: LoaderOptions);


        /**
        Hide the loading animation.
        @method
        */
        hide(): void;
        /**
        Show the loading animation.
        @method
        */
        show(): void;

    }

    interface LoaderOptions {
        name?: string;
    }
    interface LoaderEvent {
        sender: Loader;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class ModalView extends kendo.mobile.ui.Widget {

        static fn: ModalView;

        options: ModalViewOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): ModalView;

        constructor(element: Element, options?: ModalViewOptions);


        /**
        Close the ModalView
        @method
        */
        close(): void;
        /**
        Prepares the ModalView for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Open the ModalView
        @method
        @param target - The target of the ModalView
        */
        open(target?: JQuery): void;

    }

    interface ModalViewOptions {
        name?: string;
        /**
        The height of the ModalView container in pixels. If not set, the element style is used.
        @member {number}
        */
        height?: number;
        /**
        When set to false, the ModalView will close when the user taps outside of its element.
        @member {boolean}
        */
        modal?: boolean;
        /**
        The width of the ModalView container in pixels. If not set, the element style is used.
        @member {number}
        */
        width?: number;
        /**
        Fires before the ModalView is shown. calling preventDefault on the event argument will cancel the open.
        */
        beforeOpen?(e: ModalViewBeforeOpenEvent): void;
        /**
        Fired when the mobile ModalView is closed by the user.
        */
        close?(e: ModalViewCloseEvent): void;
        /**
        Fired when the mobile ModalView and its child widgets are initialized.
        */
        init?(e: ModalViewInitEvent): void;
        /**
        Fires when the ModalView is shown.
        */
        open?(e: ModalViewOpenEvent): void;
    }
    interface ModalViewEvent {
        sender: ModalView;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ModalViewBeforeOpenEvent extends ModalViewEvent {
        /**
        The invocation target of the ModalView.
        @member {JQuery}
        */
        target?: JQuery;
    }

    interface ModalViewCloseEvent extends ModalViewEvent {
    }

    interface ModalViewInitEvent extends ModalViewEvent {
    }

    interface ModalViewOpenEvent extends ModalViewEvent {
        /**
        The invocation target of the ModalView.
        @member {JQuery}
        */
        target?: JQuery;
    }


    class NavBar extends kendo.mobile.ui.Widget {

        static fn: NavBar;

        options: NavBarOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): NavBar;

        constructor(element: Element, options?: NavBarOptions);


        /**
        Prepares the NavBar for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Update the title element text. The title element is specified by setting the role data attribute to view-title.
        @method
        @param value - The text of title
        */
        title(value: string): void;

    }

    interface NavBarOptions {
        name?: string;
    }
    interface NavBarEvent {
        sender: NavBar;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Pane extends kendo.mobile.ui.Widget {

        static fn: Pane;

        options: PaneOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Pane;

        constructor(element: Element, options?: PaneOptions);


        /**
        Prepares the Pane for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Hide the loading animation.
        @method
        */
        hideLoading(): void;
        /**
        Navigate the local or remote view.
        @method
        @param url - The id or URL of the view.
        @param transition - The transition to apply when navigating. See View Transitions for more information.
        */
        navigate(url: string, transition: string): void;
        /**
        Navigate to local or to remote view. The view will replace the current one in the history stack.
        @method
        @param url - The id or URL of the view.
        @param transition - The transition to apply when navigating. See View Transitions for more information.
        */
        replace(url: string, transition: string): void;
        /**
        Show the loading animation.
        @method
        */
        showLoading(): void;
        /**
        Get a reference to the current view.
        @method
        @returns the view instance.
        */
        view(): kendo.mobile.ui.View;

    }

    interface PaneOptions {
        name?: string;
        /**
        Applicable when the pane is inside a SplitView. If set to true, the pane will be hidden when the device is in portrait position. The expandPanes SplitView method displays the hidden panes.The id of the initial mobile View to display.
        @member {boolean}
        */
        collapsible?: boolean;
        /**
        The id of the initial mobile View to display.
        @member {string}
        */
        initial?: string;
        /**
        The id of the default Pane Layout.
        @member {string}
        */
        layout?: string;
        /**
        The text displayed in the loading popup. Setting this value to false will disable the loading popup.
        @member {string}
        */
        loading?: string;
        /**
        Sets the pane width in pixels when the device is in portrait position.
        @member {number}
        */
        portraitWidth?: number;
        /**
        The default View transition.
        @member {string}
        */
        transition?: string;
        /**
        Triggered when pane navigates to a view.
        */
        navigate?(e: PaneNavigateEvent): void;
        /**
        Triggered after the pane displays a view.
        */
        viewShow?(e: PaneViewShowEvent): void;
    }
    interface PaneEvent {
        sender: Pane;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface PaneNavigateEvent extends PaneEvent {
        /**
        The URL of the view
        @member {JQuery}
        */
        url?: JQuery;
    }

    interface PaneViewShowEvent extends PaneEvent {
        /**
        The displayed view
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }


    class PopOver extends kendo.mobile.ui.Widget {

        static fn: PopOver;

        options: PopOverOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): PopOver;

        constructor(element: Element, options?: PopOverOptions);


        /**
        Close the popover.
        @method
        */
        close(): void;
        /**
        Prepares the PopOver for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Open the PopOver.
        @method
        @param target - The target of the Popover, to which the visual arrow will point to. This parameter is required for a tablet OS.
        */
        open(target: JQuery): void;

    }

    interface PopOverPane {
        /**
        The id of the initial mobile View to display.
        @member {string}
        */
        initial?: string;
        /**
        The id of the default Pane Layout.
        @member {string}
        */
        layout?: string;
        /**
        The text displayed in the loading popup. Setting this value to false will disable the loading popup.
        @member {string}
        */
        loading?: string;
        /**
        The default View transition.
        @member {string}
        */
        transition?: string;
    }

    interface PopOverPopup {
        /**
        The height of the popup in pixels.
        @member {number|string}
        */
        height?: number|string;
        /**
        The width of the popup in pixels.
        @member {number|string}
        */
        width?: number|string;
    }

    interface PopOverOptions {
        name?: string;
        /**
        The pane configuration options.
        @member {PopOverPane}
        */
        pane?: PopOverPane;
        /**
        The popup configuration options.
        @member {PopOverPopup}
        */
        popup?: PopOverPopup;
        /**
        Fires when popover is closed.
        */
        close?(e: PopOverCloseEvent): void;
        /**
        Fires when popover is opened.
        */
        open?(e: PopOverOpenEvent): void;
    }
    interface PopOverEvent {
        sender: PopOver;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface PopOverCloseEvent extends PopOverEvent {
    }

    interface PopOverOpenEvent extends PopOverEvent {
        /**
        The DOM element, which triggered the popover opening.
        @member {JQuery}
        */
        target?: JQuery;
    }


    class ScrollView extends kendo.mobile.ui.Widget {

        static fn: ScrollView;

        options: ScrollViewOptions;

        dataSource: kendo.data.DataSource;

        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): ScrollView;

        constructor(element: Element, options?: ScrollViewOptions);


        /**
        Update the ScrollView HTML content.
        @method
        @param content - The new ScrollView content.
        */
        content(content: string): void;
        /**
        Update the ScrollView HTML content.
        @method
        @param content - The new ScrollView content.
        */
        content(content: JQuery): void;
        /**
        Prepares the ScrollView for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Switches to the next page with animation.
        @method
        */
        next(): void;
        /**
        Switches to the previous page with animation.
        @method
        */
        prev(): void;
        /**
        Redraw the mobile ScrollView pager. Called automatically on device orientation change event.
        @method
        */
        refresh(): void;
        /**
        Scroll to the given page. Pages are zero-based indexed.
        @method
        @param page - The page to scroll to.
        @param instant - If set to true, the ScrollView will jump instantly to the given page without any animation effects.
        */
        scrollTo(page: number, instant: boolean): void;
        /**
        Sets the DataSource of an existing ScrollView and rebinds it.
        @method
        @param dataSource - 
        */
        setDataSource(dataSource: kendo.data.DataSource): void;
        /**
        Works in data-bound mode only. If a parameter is passed, the widget scrolls to the given dataItem. If not, the method return currently displayed dataItem.
        @method
        @param dataItem - The dataItem to set.
        @returns The currently displayed dataItem.
        */
        value(dataItem: any): any;

    }

    interface ScrollViewOptions {
        name?: string;
        /**
        If set to false the widget will not bind to the DataSource during initialization. In this case data binding will occur when the change event of the data source is fired. By default the widget will bind to the DataSource specified in the configuration.Applicable only in data bound mode.
        @member {boolean}
        */
        autoBind?: boolean;
        /**
        The velocity threshold after which a swipe will result in a bounce effect.
        @member {number}
        */
        bounceVelocityThreshold?: number;
        /**
        The height of the ScrollView content. Supports 100% if the ScrollView is embedded in a stretched view and the ScrollView element is an immediate child of the view element.
        @member {number|string}
        */
        contentHeight?: number|string;
        /**
        Instance of DataSource that the mobile ScrollView will be bound to. If DataSource is set, the widget will operate in data bound mode.
        @member {kendo.data.DataSource|any}
        */
        dataSource?: kendo.data.DataSource|any;
        /**
        The milliseconds that take the ScrollView to snap to the current page after released.
        @member {number}
        */
        duration?: number;
        /**
        The template which is used to render the pages without content. By default the ScrollView renders a blank page.Applicable only in data bound mode.
        @member {string}
        */
        emptyTemplate?: string;
        /**
        If set to true the ScrollView will display a pager. By default pager is enabled.
        @member {boolean}
        */
        enablePager?: boolean;
        /**
        Determines how many data items will be passed to the page template.Applicable only in data bound mode.
        @member {number}
        */
        itemsPerPage?: number;
        /**
        The initial page to display.
        @member {number}
        */
        page?: number;
        /**
        Multiplier applied to the snap amount of the ScrollView. By default, the widget scrolls to the next screen when swipe. If the pageSize property is set to 0.5, the ScrollView will scroll by half of the widget width.Not applicable in data bound mode.
        @member {number}
        */
        pageSize?: number;
        /**
        The template which is used to render the content of pages. By default the ScrollView renders a div element for every page.Applicable only in data bound mode.
        @member {string}
        */
        template?: string;
        /**
        The velocity threshold after which a swipe will navigate to the next page (as opposed to snapping back to the current page).
        @member {number}
        */
        velocityThreshold?: number;
        /**
        Fires before the widget page is changed. The change can be prevented by calling the preventDefault method of the event parameter, in which case the widget will snap back to the current page.
        */
        changing?(e: ScrollViewChangingEvent): void;
        /**
        Fires when the widget page is changed.
        */
        change?(e: ScrollViewChangeEvent): void;
        /**
        Fires when widget refreshes
        */
        refresh?(e: ScrollViewRefreshEvent): void;
    }
    interface ScrollViewEvent {
        sender: ScrollView;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ScrollViewChangingEvent extends ScrollViewEvent {
        /**
        The current page (zero based index)
        @member {number}
        */
        currentPage?: number;
        /**
        The page about to be displayed (zero based index)
        @member {number}
        */
        nextPage?: number;
    }

    interface ScrollViewChangeEvent extends ScrollViewEvent {
        /**
        The current page (zero based index)
        @member {number}
        */
        page?: number;
        /**
        The page element. Available only in data bound mode. Parameter will be undefined in standard mode.
        @member {JQuery}
        */
        element?: JQuery;
        /**
        The data collection. Available only in data bound mode. Parameter will be undefined in standard mode.
        @member {any}
        */
        data?: any;
    }

    interface ScrollViewRefreshEvent extends ScrollViewEvent {
        /**
        The number of pages
        @member {number}
        */
        pageCount?: number;
        /**
        The current page number (zero based index)
        @member {number}
        */
        page?: number;
    }


    class Scroller extends kendo.mobile.ui.Widget {

        static fn: Scroller;

        options: ScrollerOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Scroller;

        constructor(element: Element, options?: ScrollerOptions);


        /**
        Scrolls the scroll container to the specified location with animation. The arguments should be negative numbers.
        @method
        @param x - The horizontal offset in pixels to scroll to.
        @param y - The vertical offset in pixels to scroll to.
        */
        animatedScrollTo(x: number, y: number): void;
        /**
        Updates the scroller dimensions. Should be called after the contents of the scroller update their size
        @method
        */
        contentResized(): void;
        /**
        Prepares the Scroller for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Disables the scrolling of the element.
        @method
        */
        disable(): void;
        /**
        Enables the scrolling of the element after it has been disabled by calling disable.
        @method
        */
        enable(): void;
        /**
        Returns the viewport height of the scrollable element.
        @method
        @returns the viewport height in pixels.
        */
        height(): number;
        /**
        Indicate that the pull event is handled (i.e. data from the server has been retrieved).
        @method
        */
        pullHandled(): void;
        /**
        Scrolls the container to the top.
        @method
        */
        reset(): void;
        /**
        Returns the height in pixels of the scroller content.
        @method
        */
        scrollHeight(): void;
        /**
        Scrolls the container to the specified location. The arguments should be negative numbers.
        @method
        @param x - The horizontal offset in pixels to scroll to.
        @param y - The vertical offset in pixels to scroll to.
        */
        scrollTo(x: number, y: number): void;
        /**
        Returns the width in pixels of the scroller content.
        @method
        */
        scrollWidth(): void;
        /**
        Zooms the scroller out to the minimum zoom level possible.
        @method
        */
        zoomOut(): void;

    }

    interface ScrollerMessages {
        /**
        The message template displayed when the user pulls the scroller.
Has effect only when the pullToRefresh option is set to true.
        @member {string}
        */
        pullTemplate?: string;
        /**
        The message template displayed during the refresh.
Has effect only when the pullToRefresh option is set to true.
        @member {string}
        */
        refreshTemplate?: string;
        /**
        The message template displayed when the user pulls the scroller below the pullOffset, indicating that pullToRefresh will occur.
Has effect only when the pullToRefresh option is set to true.
        @member {string}
        */
        releaseTemplate?: string;
    }

    interface ScrollerOptions {
        name?: string;
        /**
        Weather or not to allow out of bounds dragging and easing.
        @member {boolean}
        */
        elastic?: boolean;
        /**
        Defines the text of the Scroller pull to refresh messages. Used primary for localization.
        @member {ScrollerMessages}
        */
        messages?: ScrollerMessages;
        /**
        The threshold below which releasing the scroller will trigger the pull event.
Has effect only when the pullToRefresh option is set to true.
        @member {number}
        */
        pullOffset?: number;
        /**
        If set to true, the scroller will display a hint when the user pulls the container beyond its top limit.
If a pull beyond the specified pullOffset occurs, a pull event will be triggered.
        @member {boolean}
        */
        pullToRefresh?: boolean;
        /**
        If set to true, the scroller will use the native scrolling available in the current platform. This should help with form issues on some platforms (namely Android and WP8).
Native scrolling is only enabled on platforms that support it: iOS > 4, Android > 2, WP8. BlackBerry devices do support it, but the native scroller is flaky.
        @member {boolean}
        */
        useNative?: boolean;
        /**
        If set to true, the scroller scroll hints will always be displayed.
        @member {boolean}
        */
        visibleScrollHints?: boolean;
        /**
        If set to true, the user can zoom in/out the contents of the widget using the pinch/zoom gesture.
        @member {boolean}
        */
        zoom?: boolean;
        /**
        Fires when the pull option is set to true, and the user pulls the scrolling container beyond the specified pullThreshold.
        */
        pull?(e: ScrollerEvent): void;
        /**
        Fires when the scroller dimensions change (e.g. orientation change or resize)
        */
        resize?(e: ScrollerEvent): void;
        /**
        Fires when the user scrolls through the content.
        */
        scroll?(e: ScrollerScrollEvent): void;
    }
    interface ScrollerEvent {
        sender: Scroller;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ScrollerScrollEvent extends ScrollerEvent {
        /**
        The number of pixels that are hidden from view above the scrollable area.
        @member {number}
        */
        scrollTop?: number;
        /**
        The number of pixels that are hidden from view to the left of the scrollable area.
        @member {number}
        */
        scrollLeft?: number;
    }


    class SplitView extends kendo.mobile.ui.Widget {

        static fn: SplitView;

        options: SplitViewOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): SplitView;

        constructor(element: Element, options?: SplitViewOptions);


        /**
        Prepares the SplitView for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Displays the collapsible panes; has effect only when the device is in portrait orientation.
        @method
        */
        expandPanes(): void;
        /**
        Collapses back the collapsible panes (displayed previously with expandPanes); has effect only when the device is in portrait orientation.
        @method
        */
        collapsePanes(): void;

    }

    interface SplitViewOptions {
        name?: string;
        /**
        Defines the SplitView style - horizontal or vertical.
        @member {string}
        */
        style?: string;
        /**
        Fires after the mobile SplitView and its child widgets are initialized.
        */
        init?(e: SplitViewInitEvent): void;
        /**
        Fires when the mobile SplitView becomes visible.
        */
        show?(e: SplitViewShowEvent): void;
    }
    interface SplitViewEvent {
        sender: SplitView;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface SplitViewInitEvent extends SplitViewEvent {
        /**
        The mobile SplitView instance
        @member {JQuery}
        */
        view?: JQuery;
    }

    interface SplitViewShowEvent extends SplitViewEvent {
        /**
        The mobile SplitView instance
        @member {JQuery}
        */
        view?: JQuery;
    }


    class Switch extends kendo.mobile.ui.Widget {

        static fn: Switch;

        options: SwitchOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Switch;

        constructor(element: Element, options?: SwitchOptions);


        /**
        Get/Set the checked state of the widget.
        @method
        @returns The checked state of the widget.
        */
        check(): boolean;
        /**
        Get/Set the checked state of the widget.
        @method
        @param check - Whether to turn the widget on or off.
        */
        check(check: boolean): void;
        /**
        Prepares the Switch for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Changes the enabled state of the widget.
        @method
        @param enable - Whether to enable or disable the widget.
        */
        enable(enable: boolean): void;
        /**
        Forces the Switch to recalculate its dimensions. Useful when major changes in the interface happen dynamically, like for instance changing the skin.
        @method
        */
        refresh(): void;
        /**
        Toggle the checked state of the widget.
        @method
        */
        toggle(): void;

    }

    interface SwitchOptions {
        name?: string;
        /**
        The checked state of the widget.
        @member {boolean}
        */
        checked?: boolean;
        /**
        If set to false the widget will be disabled and will not allow the user to change its checked state. The widget is enabled by default.
        @member {boolean}
        */
        enable?: boolean;
        /**
        The OFF label.
        @member {string}
        */
        offLabel?: string;
        /**
        The ON label.
        @member {string}
        */
        onLabel?: string;
        /**
        Fires when the state of the widget changes
        */
        change?(e: SwitchChangeEvent): void;
    }
    interface SwitchEvent {
        sender: Switch;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface SwitchChangeEvent extends SwitchEvent {
        /**
        The checked state of the widget.
        @member {any}
        */
        checked?: any;
    }


    class TabStrip extends kendo.mobile.ui.Widget {

        static fn: TabStrip;

        options: TabStripOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): TabStrip;

        constructor(element: Element, options?: TabStripOptions);


        /**
        Introduced in Q1 2013 SP Sets a badge on one of the tabs with the specified value. If invoked without second parameter, returns the tab's current badge value. Set the value to false to remove the badge.
        @method
        @param tab - The target tab specified either as a jQuery selector/object or as an item index.
        @param value - The target value to be set or false to be removed.
        @returns Returns the badge value if invoked without parameters, otherwise returns the TabStrip object.
        */
        badge(tab: string, value: string): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on one of the tabs with the specified value. If invoked without second parameter, returns the tab's current badge value. Set the value to false to remove the badge.
        @method
        @param tab - The target tab specified either as a jQuery selector/object or as an item index.
        @param value - The target value to be set or false to be removed.
        @returns Returns the badge value if invoked without parameters, otherwise returns the TabStrip object.
        */
        badge(tab: string, value: boolean): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on one of the tabs with the specified value. If invoked without second parameter, returns the tab's current badge value. Set the value to false to remove the badge.
        @method
        @param tab - The target tab specified either as a jQuery selector/object or as an item index.
        @param value - The target value to be set or false to be removed.
        @returns Returns the badge value if invoked without parameters, otherwise returns the TabStrip object.
        */
        badge(tab: number, value: string): string;
        /**
        Introduced in Q1 2013 SP Sets a badge on one of the tabs with the specified value. If invoked without second parameter, returns the tab's current badge value. Set the value to false to remove the badge.
        @method
        @param tab - The target tab specified either as a jQuery selector/object or as an item index.
        @param value - The target value to be set or false to be removed.
        @returns Returns the badge value if invoked without parameters, otherwise returns the TabStrip object.
        */
        badge(tab: number, value: boolean): string;
        /**
        Get the currently selected tab DOM element.
        @method
        @returns the currently selected tab DOM element.
        */
        currentItem(): JQuery;
        /**
        Prepares the TabStrip for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Set the mobile TabStrip active tab to the tab with the specified URL. This method doesn't change the current View. To change the View, use Application's navigate method instead.
        @method
        @param url - The URL or zero based index of the tab.
        */
        switchTo(url: string): void;
        /**
        Set the mobile TabStrip active tab to the tab with the specified URL. This method doesn't change the current View. To change the View, use Application's navigate method instead.
        @method
        @param url - The URL or zero based index of the tab.
        */
        switchTo(url: number): void;
        /**
        Set the mobile TabStrip active tab to the tab with the specified full URL. This method doesn't change the current View. To change the View, use Application's navigate method instead.
        @method
        @param url - The URL of the tab.
        */
        switchByFullUrl(url: string): void;
        /**
        Clear the currently selected tab.
        @method
        */
        clear(): void;

    }

    interface TabStripOptions {
        name?: string;
        /**
        The index of the initially selected tab.
        @member {number}
        */
        selectedIndex?: number;
        /**
        Fires when tab is selected.
        */
        select?(e: TabStripSelectEvent): void;
    }
    interface TabStripEvent {
        sender: TabStrip;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface TabStripSelectEvent extends TabStripEvent {
        /**
        The selected tab
        @member {JQuery}
        */
        item?: JQuery;
    }


    class View extends kendo.mobile.ui.Widget {

        static fn: View;

        options: ViewOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): View;

        constructor(element: Element, options?: ViewOptions);


        /**
        Retrieves the current content holder of the View - this is the content element if the View is stretched or the scroll container otherwise.
        @method
        */
        contentElement(): void;
        /**
        Prepares the View for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;
        /**
        Enables or disables the user interaction with the view and its contents.
        @method
        @param enable - Omitting the parameter or passing true enables the view. Passing false disables the view.
        */
        enable(enable: boolean): void;

    }

    interface ViewOptions {
        name?: string;
        /**
        The MVVM model to bind to. If a string is passed, The view will try to resolve a reference to the view model variable in the global scope.
        @member {string}
        */
        model?: string;
        /**
        Applicable to remote views only. If set to true, the remote view contents will be reloaded from the server (using Ajax) each time the view is navigated to.
        @member {boolean}
        */
        reload?: boolean;
        /**
        Configuration options to be passed to the scroller instance instantiated by the view. For more details, check the scroller configuration options.
        @member {any}
        */
        scroller?: any;
        /**
        If set to true, the view will stretch its child contents to occupy the entire view, while disabling kinetic scrolling.
Useful if the view contains an image or a map.
        @member {boolean}
        */
        stretch?: boolean;
        /**
        The text to display in the NavBar title (if present) and the browser title.
        @member {string}
        */
        title?: string;
        /**
        If set to true, the view will use the native scrolling available in the current platform. This should help with form issues on some platforms (namely Android and WP8).
Native scrolling is only enabled on platforms that support it: iOS > 5+, Android > 3+, WP8. BlackBerry devices do support it, but the native scroller is flaky.
        @member {boolean}
        */
        useNativeScrolling?: boolean;
        /**
        If set to true, the user can zoom in/out the contents of the view using the pinch/zoom gesture.
        @member {boolean}
        */
        zoom?: boolean;
        /**
        Fires after the mobile View becomes visible. If the view is displayed with transition, the event is triggered after the transition is complete.
        */
        afterShow?(e: ViewAfterShowEvent): void;
        /**
        Fires before the mobile View becomes hidden.
        */
        beforeHide?(e: ViewBeforeHideEvent): void;
        /**
        Fires before the mobile View becomes visible. The event can be prevented by calling the preventDefault method of the event parameter, in case a redirection should happen.
        */
        beforeShow?(e: ViewBeforeShowEvent): void;
        /**
        Fires when the mobile View becomes hidden.
        */
        hide?(e: ViewHideEvent): void;
        /**
        Fires after the mobile View and its child widgets are initialized.
        */
        init?(e: ViewInitEvent): void;
        /**
        Fires when the mobile View becomes visible.
        */
        show?(e: ViewShowEvent): void;
        /**
        Fires when the mobile view transition starts.
        */
        transitionStart?(e: ViewTransitionStartEvent): void;
        /**
        Fires after the mobile view transition container has its k-fx-end class set. Setting CSS properties to the view at the event handler will animate them.
        */
        transitionEnd?(e: ViewTransitionEndEvent): void;
    }
    interface ViewEvent {
        sender: View;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface ViewAfterShowEvent extends ViewEvent {
        /**
        The mobile view instance
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }

    interface ViewBeforeHideEvent extends ViewEvent {
        /**
        The mobile view instance
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }

    interface ViewBeforeShowEvent extends ViewEvent {
        /**
        The mobile view instance
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }

    interface ViewHideEvent extends ViewEvent {
        /**
        The mobile view instance
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }

    interface ViewInitEvent extends ViewEvent {
        /**
        The mobile view instance
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }

    interface ViewShowEvent extends ViewEvent {
        /**
        The mobile view instance.
        @member {kendo.mobile.ui.View}
        */
        view?: kendo.mobile.ui.View;
    }

    interface ViewTransitionStartEvent extends ViewEvent {
        /**
        The transition type. Can be either "show" or "hide"
        @member {string}
        */
        type?: string;
    }

    interface ViewTransitionEndEvent extends ViewEvent {
        /**
        The transition type. Can be either "show" or "hide"
        @member {string}
        */
        type?: string;
    }


}
declare module kendo.ui {
    class Touch extends kendo.ui.Widget {

        static fn: Touch;

        options: TouchOptions;


        element: JQuery;
        wrapper: JQuery;

        static extend(proto: Object): Touch;

        constructor(element: Element, options?: TouchOptions);


        /**
        Cancels the current touch event sequence. Calling cancel in a touchstart or dragmove will disable subsequent move or tap/end/hold event handlers from being called.
        @method
        */
        cancel(): void;
        /**
        Prepares the Touch for safe removal from DOM. Detaches all event handlers and removes jQuery.data attributes to avoid memory leaks. Calls destroy method of any child Kendo widgets.
        @method
        */
        destroy(): void;

    }

    interface TouchOptions {
        name?: string;
        /**
        jQuery selector that specifies child elements that are touchable if a widget is attached to a container.
        @member {string}
        */
        filter?: string;
        /**
        If specified, the user drags will be tracked within the surface boundaries.
This option is useful if the widget is instantiated on small DOM elements like buttons, or thin list items.
        @member {JQuery}
        */
        surface?: JQuery;
        /**
        If set to true, the widget will capture and trigger the gesturestart, gesturechange, and gestureend events when the user touches the element with two fingers.
        @member {boolean}
        */
        multiTouch?: boolean;
        /**
        If set to true, the Touch widget will recognize horizontal swipes and trigger the swipe event.Notice: if the enableSwipe option is set to true, the dragstart, drag and dragend events will not be triggered.
        @member {boolean}
        */
        enableSwipe?: boolean;
        /**
        The minimum horizontal distance in pixels the user should swipe before the swipe event is triggered.
        @member {number}
        */
        minXDelta?: number;
        /**
        The maximum vertical deviation in pixels of the swipe event. Swipes with higher deviation are discarded.
        @member {number}
        */
        maxYDelta?: number;
        /**
        The maximum amount of time in milliseconds the swipe event can last. Slower swipes are discarded.
        @member {number}
        */
        maxDuration?: number;
        /**
        The timeout in milliseconds before the hold event is fired.Notice: the hold event will be triggered after the time passes, not after the user lifts his/hers finger.
        @member {number}
        */
        minHold?: number;
        /**
        The maximum period (in milliseconds) between two consecutive taps which will trigger the doubletap event.
        @member {number}
        */
        doubleTapTimeout?: number;
        /**
        Fires when the user presses the element.
        */
        touchstart?(e: TouchTouchstartEvent): void;
        /**
        Fires when the user starts dragging the element.
        */
        dragstart?(e: TouchDragstartEvent): void;
        /**
        Fires each time the user drags (within the element boundaries).
        */
        drag?(e: TouchDragEvent): void;
        /**
        Fires when the user lifts his/hers finger, or drags outside of the element boundaries.
        */
        dragend?(e: TouchDragendEvent): void;
        /**
        Fires when the user taps on the element. A touch sequence is considered a tap if the user does not perform dragging.
        */
        tap?(e: TouchTapEvent): void;
        /**
        Fires when the user quickly taps twice on the element.
        */
        doubletap?(e: TouchDoubletapEvent): void;
        /**
        Fires when the user presses and holds  his/hers finger on the element for a minimum amount of time.The minimum amount can be configured through the minHold configuration option.
        */
        hold?(e: TouchHoldEvent): void;
        /**
        Fires when the user performs a horizontal swipe on the element.For this event to be triggered, the enableSwipe configuration option should be set to true.
        */
        swipe?(e: TouchSwipeEvent): void;
        /**
        Fires when the user presses the element with two fingers (or presses with a second finger while a first finger is still touching the element).
        */
        gesturestart?(e: TouchGesturestartEvent): void;
        /**
        Fires when the user moves a finger while multiple fingers are touching the element.
        */
        gesturechange?(e: TouchGesturechangeEvent): void;
        /**
        Fires when the user lifts the second finger from the element.
Notice: After the last finger is moved, the dragend event is fired.
        */
        gestureend?(e: TouchGestureendEvent): void;
    }
    interface TouchEvent {
        sender: Touch;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface TouchTouchstartEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchDragstartEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchDragEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchDragendEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchTapEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchDoubletapEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchHoldEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchSwipeEvent extends TouchEvent {
        /**
        The touch event instance
        @member {kendo.mobile.ui.TouchEventOptions}
        */
        touch?: kendo.mobile.ui.TouchEventOptions;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
    }

    interface TouchGesturestartEvent extends TouchEvent {
        /**
        An array containing the active touches.
        @member {any}
        */
        touches?: any;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
        /**
        The distance (in pixels) between the two touches.
        @member {number}
        */
        distance?: number;
        /**
        The center point between the two touches. The point has two properties, x and y, which contain the x and the y coordinate, respectively.
        @member {kendo.mobile.ui.Point}
        */
        center?: kendo.mobile.ui.Point;
    }

    interface TouchGesturechangeEvent extends TouchEvent {
        /**
        An array containing the active touches.
        @member {any}
        */
        touches?: any;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
        /**
        The distance (in pixels) between the two touches
        @member {number}
        */
        distance?: number;
        /**
        The center point between the two touches. The point has two properties, x and y, which contain the x and the y coordinate, respectively.
        @member {kendo.mobile.ui.Point}
        */
        center?: kendo.mobile.ui.Point;
    }

    interface TouchGestureendEvent extends TouchEvent {
        /**
        An array containing the active touches
        @member {any}
        */
        touches?: any;
        /**
        The jQuery event which triggered the touch event.
        @member {JQueryEventObject}
        */
        event?: JQueryEventObject;
        /**
        The distance (in pixels) between the two touches
        @member {number}
        */
        distance?: number;
        /**
        The center point between the two touches. The point has two properties, x and y, which contain the x and the y coordinate, respectively.
        @member {kendo.mobile.ui.Point}
        */
        center?: kendo.mobile.ui.Point;
    }


}
declare module kendo.ooxml {
    class Workbook extends Observable {


        options: WorkbookOptions;

        /**
                The sheets of the workbook. Every sheet represents a page from the final Excel file.See sheets configuration.
                */
                sheets: WorkbookSheet[];

        constructor(options?: WorkbookOptions);


        /**
        Creates an Excel file that represents the current workbook and returns it as a data URL.
        @method
        @returns the Excel file as data URL.
        */
        toDataURL(): string;

    }

    interface WorkbookSheetColumn {
        /**
        If set to true the column will stretch to fit the contents of all cells.
        @member {boolean}
        */
        autoWidth?: boolean;
        /**
        The zero-based index of the column in the sheet.
Defaults to the index of the object in the array.
        @member {number}
        */
        index?: number;
        /**
        The width of the column in pixels.
        @member {number}
        */
        width?: number;
    }

    interface WorkbookSheetFilter {
        /**
        The index of the first filterable column.
        @member {number}
        */
        from?: number;
        /**
        The index of the last filterable column.
        @member {number}
        */
        to?: number;
    }

    interface WorkbookSheetFreezePane {
        /**
        Deprecated in versions 2015.3 and newer. Use
frozenColumns instead.
        @member {number}
        */
        colSplit?: number;
        /**
        Deprecated in versions 2015.3 and newer. Use
frozenRows instead.
        @member {number}
        */
        rowSplit?: number;
    }

    interface WorkbookSheetRowCellBorderBottom {
        /**
        The bottom border color of the cell.Many standard CSS formats are supported, but the canonical form is "#ccff00".
        @member {string}
        */
        color?: string;
        /**
        The width of the border in pixels.The allowed values are:
* 1 - Results in а "thin" border.
* 2 - Results in а "medium" border.
* 3 - Results in а "thick" border.
        @member {number}
        */
        size?: number;
    }

    interface WorkbookSheetRowCellBorderLeft {
        /**
        The left border color of the cell.Many standard CSS formats are supported, but the canonical form is "#ccff00".
        @member {string}
        */
        color?: string;
        /**
        The width of the border in pixels.The allowed values are:
* 1 - Results in а "thin" border.
* 2 - Results in а "medium" border.
* 3 - Results in а "thick" border.
        @member {number}
        */
        size?: number;
    }

    interface WorkbookSheetRowCellBorderRight {
        /**
        The right border color of the cell.Many standard CSS formats are supported, but the canonical form is "#ccff00".
        @member {string}
        */
        color?: string;
        /**
        The width of the border in pixels.The allowed values are:
* 1 - Results in а "thin" border.
* 2 - Results in а "medium" border.
* 3 - Results in а "thick" border.
        @member {number}
        */
        size?: number;
    }

    interface WorkbookSheetRowCellBorderTop {
        /**
        The top border color of the cell.Many standard CSS formats are supported, but the canonical form is "#ccff00".
        @member {string}
        */
        color?: string;
        /**
        The width of the border in pixels.The allowed values are:
* 1 - Results in а "thin" border.
* 2 - Results in а "medium" border.
* 3 - Results in а "thick" border.
        @member {number}
        */
        size?: number;
    }

    interface WorkbookSheetRowCell {
        /**
        Sets the background color of the cell. Supports hex CSS-like values that start with "#" e.g. "#ff00ff".
        @member {string}
        */
        background?: string;
        /**
        The style information for the bottom border of the cell.
        @member {WorkbookSheetRowCellBorderBottom}
        */
        borderBottom?: WorkbookSheetRowCellBorderBottom;
        /**
        The style information for the left border of the cell.
        @member {WorkbookSheetRowCellBorderLeft}
        */
        borderLeft?: WorkbookSheetRowCellBorderLeft;
        /**
        The style information for the top border of the cell.
        @member {WorkbookSheetRowCellBorderTop}
        */
        borderTop?: WorkbookSheetRowCellBorderTop;
        /**
        The style information for the right border of the cell.
        @member {WorkbookSheetRowCellBorderRight}
        */
        borderRight?: WorkbookSheetRowCellBorderRight;
        /**
        Setting it to true makes the cell value bold.
        @member {boolean}
        */
        bold?: boolean;
        /**
        The text color of the cell. Supports hex CSS-like values that start with "#" e.g. "#ff00ff".
        @member {string}
        */
        color?: string;
        /**
        Sets the number of columns that a cell occupies.
        @member {number}
        */
        colSpan?: number;
        /**
        Sets the font used to display the cell value.
        @member {string}
        */
        fontFamily?: string;
        /**
        Deprecated in versions 2015.3 and newer. Use fontFamily instead.
        @member {string}
        */
        fontName?: string;
        /**
        Sets the font size in pixels.
        @member {number}
        */
        fontSize?: number;
        /**
        Sets the format that Excel uses to display the cell value.The Create a custom number format page describes the formats that Excel supports.
        @member {string}
        */
        format?: string;
        /**
        Sets the formula that Excel uses to compute and display the cell value
        @member {string}
        */
        formula?: string;
        /**
        Deprecated in versions 2015.3 and newer. Use textAlign instead.
        @member {string}
        */
        hAlign?: string;
        /**
        The zero-based index of the cell in the row.
        @member {any}
        */
        index?: any;
        /**
        Setting it to true italicizes the cell value.
        @member {boolean}
        */
        italic?: boolean;
        /**
        Sets the number of rows that a cell occupies.
        @member {number}
        */
        rowSpan?: number;
        /**
        Sets the horizontal alignment of the cell value. Supported values are "left", "center" and "right".
        @member {string}
        */
        textAlign?: string;
        /**
        Setting it to true underlines the cell value.
        @member {boolean}
        */
        underline?: boolean;
        /**
        Setting it to true wraps the cell value.
        @member {boolean}
        */
        wrap?: boolean;
        /**
        Deprecated in versions 2015.3 and newer. Use verticalAlign instead.
        @member {string}
        */
        vAlign?: string;
        /**
        Sets the vertical alignment of the cell value. Supported values are "top", "center" and "bottom".
        @member {string}
        */
        verticalAlign?: string;
        /**
        The value of the cell. Numbers and dates will be formatted as strings. String values are HTML encoded.
        @member {Date|number|string|boolean}
        */
        value?: Date|number|string|boolean;
    }

    interface WorkbookSheetRow {
        cells?: WorkbookSheetRowCell[];
        /**
        The zero-based index of the row in the sheet.
Defaults to the index of the object in the array.
        @member {number}
        */
        index?: number;
        /**
        The row height in pixels.
        @member {number}
        */
        height?: number;
    }

    interface WorkbookSheet {
        columns?: WorkbookSheetColumn[];
        /**
        Deprecated in versions 2015.3 and newer. Use
frozenColumns and
frozenRows instead.
        @member {WorkbookSheetFreezePane}
        */
        freezePane?: WorkbookSheetFreezePane;
        /**
        The number of frozen columns in this sheet.
        @member {number}
        */
        frozenColumns?: number;
        /**
        The number of frozen rows in this sheet.
        @member {number}
        */
        frozenRows?: number;
        /**
        Excel auto filter configuration. When set the final document will have auto filtering enabled.
        @member {WorkbookSheetFilter}
        */
        filter?: WorkbookSheetFilter;
        /**
        Sets the name of the exported workbook sheet.
        @member {string}
        */
        name?: string;
        rows?: WorkbookSheetRow[];
        /**
        Deprecated in versions 2015.3 and newer. Use name instead.
        @member {string}
        */
        title?: string;
    }

    interface WorkbookOptions {
        name?: string;
        /**
        The creator of the workbook.
        @member {string}
        */
        creator?: string;
        /**
        The date when the workbook is created. The default value is new Date().
        @member {Date}
        */
        date?: Date;
        sheets?: WorkbookSheet[];
    }
    interface WorkbookEvent {
        sender: Workbook;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


}

declare module kendo.dataviz.drawing {
    class Arc extends kendo.drawing.Element {


        options: ArcOptions;


        constructor(geometry: kendo.geometry.Arc, options?: ArcOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the arc geometry.
        @method
        @returns The current arc geometry.
        */
        geometry(): kendo.geometry.Arc;
        /**
        Gets or sets the arc geometry.
        @method
        @param value - The new geometry to use.
        */
        geometry(value: kendo.geometry.Arc): void;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Arc;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Arc;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface ArcOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface ArcEvent {
        sender: Arc;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Circle extends kendo.drawing.Element {


        options: CircleOptions;


        constructor(geometry: kendo.geometry.Circle, options?: CircleOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the circle geometry.
        @method
        @returns The current circle geometry.
        */
        geometry(): kendo.geometry.Circle;
        /**
        Gets or sets the circle geometry.
        @method
        @param value - The new geometry to use.
        */
        geometry(value: kendo.geometry.Circle): void;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Circle;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Circle;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface CircleOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface CircleEvent {
        sender: Circle;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Element extends kendo.Class {


        options: ElementOptions;


        constructor(options?: ElementOptions);


        /**
        Returns the bounding box of the element with transformations applied.
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.This is the rectangle that will fit around the actual rendered element.
        @method
        @returns The bounding box of the element with clipping and transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Gets or sets the transformation of the element.
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface ElementOptions {
        name?: string;
        /**
        The clipping path for this element.The path instance will be monitored for changes.
It can be replaced by calling the clip method.
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element CSS cursor.Applicable to SVG and VML outputs.
        @member {string}
        */
        cursor?: string;
        /**
        The element opacity.
        @member {number}
        */
        opacity?: number;
        /**
        The transformation to apply to this element.
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
        @member {boolean}
        */
        visible?: boolean;
    }
    interface ElementEvent {
        sender: Element;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    interface FillOptions  {



        /**
                The fill color in any of the following formats.| Format         | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the fill.
                */
                color?: string;
        /**
                The fill opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
                */
                opacity?: number;




    }



    class Gradient extends kendo.Class {


        options: GradientOptions;

        /**
                The array of gradient color stops.
Contains GradientStop instances.
                */
                stops: any;

        constructor(options?: GradientOptions);


        /**
        Adds a color stop to the gradient.
        @method
        @param offset - The stop offset from the start of the element.
Ranges from 0 (start of gradient) to 1 (end of gradient).
        @param color - The color in any of the following formats.| Format         | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the fill.
        @param opacity - The fill opacity.
Ranges from 0 (completely transparent) to 1 (completely opaque).
        @returns The new gradient color stop.
        */
        addStop(offset: number, color: string, opacity: number): kendo.drawing.GradientStop;
        /**
        Removes a color stop from the gradient.
        @method
        @param stop - The gradient color stop to remove.
        */
        removeStop(stop: kendo.drawing.GradientStop): void;

    }

    interface GradientOptions {
        name?: string;
        /**
        The color stops of the gradient.
Can contain either plain objects or GradientStop instances.
        @member {any}
        */
        stops?: any;
    }
    interface GradientEvent {
        sender: Gradient;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class GradientStop extends kendo.Class {


        options: GradientStopOptions;


        constructor(options?: GradientStopOptions);



    }

    interface GradientStopOptions {
        name?: string;
        /**
        The stop offset from the start of the element.
Ranges from 0 (start of gradient) to 1 (end of gradient).
        @member {number}
        */
        offset?: number;
        /**
        The color in any of the following formats.| Format         | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the fill.
        @member {string}
        */
        color?: string;
        /**
        The fill opacity.
Ranges from 0 (completely transparent) to 1 (completely opaque).
        @member {number}
        */
        opacity?: number;
    }
    interface GradientStopEvent {
        sender: GradientStop;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Group extends kendo.drawing.Element {


        options: GroupOptions;

        /**
                The children of this group.
                */
                children: any;

        constructor(options?: GroupOptions);


        /**
        Appends the specified element as a last child of the group.
        @method
        @param element - The element to append. Multiple parameters are accepted.
        */
        append(element: kendo.drawing.Element): void;
        /**
        Removes all child elements from the group.
        @method
        */
        clear(): void;
        /**
        Gets or sets the group clipping path.
Inherited from Element.clip
        @method
        @returns The current group clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the group clipping path.
Inherited from Element.clip
        @method
        @param clip - The group clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Inserts an element at the specified position.
        @method
        @param position - The position to insert the element at. Existing children beyond this position will be shifted right.
        @param element - The element to insert.
        */
        insert(position: number, element: kendo.drawing.Element): void;
        /**
        Gets or sets the group opacity.
Inherited from Element.opacityThe opacity of any child groups and elements will be multiplied by this value.
        @method
        @returns The current group opacity.
        */
        opacity(): number;
        /**
        Gets or sets the group opacity.
Inherited from Element.opacityThe opacity of any child groups and elements will be multiplied by this value.
        @method
        @param opacity - The group opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Removes the specified element from the group.
        @method
        @param element - The element to remove.
        */
        remove(element: kendo.drawing.Element): void;
        /**
        Removes the child element at the specified position.
        @method
        @param index - The index at which the element currently resides.
        */
        removeAt(index: number): void;
        /**
        Gets or sets the visibility of the element.
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface GroupOptions {
        name?: string;
        /**
        The group clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The group cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The group opacity.
Inherited from Element.opacityThe opacity of any child groups and elements will be multiplied by this value.
        @member {number}
        */
        opacity?: number;
        /**
        Page options to apply during PDF export.
        @member {kendo.drawing.PDFOptions}
        */
        pdf?: kendo.drawing.PDFOptions;
        /**
        The transformation to apply to this group and its children.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the group and its children are visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface GroupEvent {
        sender: Group;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Image extends kendo.drawing.Element {


        options: ImageOptions;


        constructor(src: string, rect: kendo.geometry.Rect);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacity
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacity
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Gets or sets the image source URL.
        @method
        @returns The current image source URL.
        */
        src(): string;
        /**
        Gets or sets the image source URL.
        @method
        @param value - The new source URL.
        */
        src(value: string): void;
        /**
        Gets or sets the rectangle defines the image position and size.
        @method
        @returns The current image rectangle.
        */
        rect(): kendo.geometry.Rect;
        /**
        Gets or sets the rectangle defines the image position and size.
        @method
        @param value - The new image rectangle.
        */
        rect(value: kendo.geometry.Rect): void;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface ImageOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface ImageEvent {
        sender: Image;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Layout extends kendo.drawing.Group {


        options: LayoutOptions;


        constructor(rect: kendo.geometry.Rect, options?: LayoutOptions);


        /**
        Gets or sets the layout rectangle.
        @method
        @returns The current rectangle.
        */
        rect(): kendo.geometry.Rect;
        /**
        Gets or sets the layout rectangle.
        @method
        @param rect - The layout rectangle.
        */
        rect(rect: kendo.geometry.Rect): void;
        /**
        Arranges the elements based on the current options.
        @method
        */
        reflow(): void;

    }

    interface LayoutOptions {
        name?: string;
        /**
        Specifies the alignment of the content. The supported values are:
        @member {string}
        */
        alignContent?: string;
        /**
        Specifies the alignment of the items based on the largest one. The supported values are:
        @member {string}
        */
        alignItems?: string;
        /**
        Specifies how should the content be justified. The supported values are:
        @member {string}
        */
        justifyContent?: string;
        /**
        Specifies the distance between the lines for wrapped layout.
        @member {number}
        */
        lineSpacing?: number;
        /**
        Specifies the distance between the elements.
        @member {number}
        */
        spacing?: number;
        /**
        Specifies layout orientation. The supported values are:
        @member {string}
        */
        orientation?: string;
        /**
        Specifies the behavior when the elements size exceeds the rectangle size. If set to true, the elements will be moved to the next "line". If set to false, the layout will be scaled so that the elements fit in the rectangle.
        @member {boolean}
        */
        wrap?: boolean;
    }
    interface LayoutEvent {
        sender: Layout;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class LinearGradient extends kendo.drawing.Gradient {


        options: LinearGradientOptions;

        /**
                The array of gradient color stops.
Contains GradientStop instances.
                */
                stops: any;

        constructor(options?: LinearGradientOptions);


        /**
        Adds a color stop to the gradient.
Inherited from Gradient.addStop
        @method
        @param offset - 
        @param color - The color of the stop.
        @param opacity - The fill opacity.
        @returns The new gradient color stop.
        */
        addStop(offset: number, color: string, opacity: number): kendo.drawing.GradientStop;
        /**
        Gets or sets the end point of the gradient.
        @method
        @returns The current end point of the gradient.
        */
        end(): kendo.geometry.Point;
        /**
        Gets or sets the end point of the gradient.
        @method
        @param end - The end point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        end(end: any): void;
        /**
        Gets or sets the end point of the gradient.
        @method
        @param end - The end point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        end(end: kendo.geometry.Point): void;
        /**
        Gets or sets the start point of the gradient.
        @method
        @returns The current start point of the gradient.
        */
        start(): kendo.geometry.Point;
        /**
        Gets or sets the start point of the gradient.
        @method
        @param start - The start point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        start(start: any): void;
        /**
        Gets or sets the start point of the gradient.
        @method
        @param start - The start point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        start(start: kendo.geometry.Point): void;
        /**
        Removes a color stop from the gradient.
Inherited from Gradient.removeStop
        @method
        @param stop - The gradient color stop to remove.
        */
        removeStop(stop: kendo.drawing.GradientStop): void;

    }

    interface LinearGradientOptions {
        name?: string;
        /**
        The color stops of the gradient.
Can contain either plain objects or GradientStop instances.
        @member {any}
        */
        stops?: any;
    }
    interface LinearGradientEvent {
        sender: LinearGradient;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class MultiPath extends kendo.drawing.Element {


        options: MultiPathOptions;

        /**
                A collection of sub-paths.
                */
                paths: any;

        constructor(options?: MultiPathOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Closes the current sub-path by linking its current end point with its start point.
        @method
        @returns The current instance to allow chaining.
        */
        close(): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.MultiPath;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.MultiPath;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.MultiPath;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: number, y?: number): kendo.drawing.MultiPath;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: any, y?: number): kendo.drawing.MultiPath;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: kendo.geometry.Point, y?: number): kendo.drawing.MultiPath;
        /**
        Creates a new sub-path or clears all segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: number, y?: number): kendo.drawing.MultiPath;
        /**
        Creates a new sub-path or clears all segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: any, y?: number): kendo.drawing.MultiPath;
        /**
        Creates a new sub-path or clears all segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: kendo.geometry.Point, y?: number): kendo.drawing.MultiPath;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.MultiPath;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface MultiPathOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface MultiPathEvent {
        sender: MultiPath;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class OptionsStore extends kendo.Class {


        options: OptionsStoreOptions;

        /**
                An optional observer for the options store.Upon field modification, the optionsChange(e) method on the observer will be called
with a single argument containing two fields:
* field - The fully qualified field name
* value - The new field value
                */
                observer: any;

        constructor(options?: OptionsStoreOptions);


        /**
        Gets the value of the specified option.
        @method
        @param field - The field name to retrieve.
Must be a fully qualified name (e.g. "foo.bar") for nested options.
        @returns The current option value.
        */
        get(field: string): any;
        /**
        Sets the value of the specified option.
        @method
        @param field - The name of the option to set.
Must be a fully qualified name (e.g. "foo.bar") for nested options.
        @param value - The new option value.If the new value is exactly the same as the new value the operation
will not trigger options change on the observer (if any).
        */
        set(field: string, value: any): void;

    }

    interface OptionsStoreOptions {
        name?: string;
    }
    interface OptionsStoreEvent {
        sender: OptionsStore;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    interface PDFOptions  {



        /**
                The creator of the PDF document.
                */
                creator?: string;
        /**
                The date when the PDF document is created. Defaults to new Date().
                */
                date?: Date;
        /**
                Specifies the keywords of the exported PDF file.
                */
                keywords?: string;
        /**
                Set to true to reverse the paper dimensions if needed such that width is the larger edge.
                */
                landscape?: boolean;
        /**
                Specifies the margins of the page (numbers or strings with units). Supported
units are "mm", "cm", "in" and "pt" (default).
                */
                margin?: any;
        /**
                Specifies the paper size of the PDF document.
The default "auto" means paper size is determined by content.Supported values:
                */
                paperSize?: any;
        /**
                Sets the subject of the PDF file.
                */
                subject?: string;
        /**
                Sets the title of the PDF file.
                */
                title?: string;




    }



    class Path extends kendo.drawing.Element {


        options: PathOptions;

        /**
                A collection of the path segments.
                */
                segments: any;

        constructor(options?: PathOptions);

        static fromPoints(points: any): kendo.drawing.Path;
        static fromRect(rect: kendo.geometry.Rect): kendo.drawing.Path;
        static parse(svgPath: string, options?: any): kendo.drawing.Path;

        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Closes the path by linking the current end point with the start point.
        @method
        @returns The current instance to allow chaining.
        */
        close(): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: any, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: any, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: any): kendo.drawing.Path;
        /**
        Draws a cubic Bézier curve (with two control points).A quadratic Bézier curve (with one control point) can be plotted by making the control point equal.
        @method
        @param controlOut - The first control point for the curve.
        @param controlIn - The second control point for the curve.
        @param endPoint - The curve end point.
        @returns The current instance to allow chaining.
        */
        curveTo(controlOut: kendo.geometry.Point, controlIn: kendo.geometry.Point, endPoint: kendo.geometry.Point): kendo.drawing.Path;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Path;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: number, y?: number): kendo.drawing.Path;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: any, y?: number): kendo.drawing.Path;
        /**
        Draws a straight line to the specified absolute coordinates.
        @method
        @param x - The line end X coordinate or a Point/Array with X and Y coordinates.
        @param y - The line end Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        lineTo(x: kendo.geometry.Point, y?: number): kendo.drawing.Path;
        /**
        Clears all existing segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: number, y?: number): kendo.drawing.Path;
        /**
        Clears all existing segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: any, y?: number): kendo.drawing.Path;
        /**
        Clears all existing segments and moves the starting point to the specified absolute coordinates.
        @method
        @param x - The starting X coordinate or a Point/Array with X and Y coordinates.
        @param y - The starting Y coordinate.Optional if the first parameter is a Point/Array.
        @returns The current instance to allow chaining.
        */
        moveTo(x: kendo.geometry.Point, y?: number): kendo.drawing.Path;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Path;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface PathOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface PathEvent {
        sender: Path;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class RadialGradient extends kendo.drawing.Gradient {


        options: RadialGradientOptions;

        /**
                The array of gradient color stops.
Contains GradientStop instances.
                */
                stops: any;

        constructor(options?: RadialGradientOptions);


        /**
        Adds a color stop to the gradient.
Inherited from Gradient.addStop
        @method
        @param offset - 
        @param color - The color of the stop.
        @param opacity - The fill opacity.
        @returns The new gradient color stop.
        */
        addStop(offset: number, color: string, opacity: number): kendo.drawing.GradientStop;
        /**
        Gets or sets the center point of the gradient.
        @method
        @returns The current radius of the gradient.
        */
        center(): kendo.geometry.Point;
        /**
        Gets or sets the center point of the gradient.
        @method
        @param center - The center point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        center(center: any): void;
        /**
        Gets or sets the center point of the gradient.
        @method
        @param center - The center point of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        */
        center(center: kendo.geometry.Point): void;
        /**
        Gets or sets the radius of the gradient.
        @method
        @returns The current radius of the gradient.
        */
        radius(): number;
        /**
        Gets or sets the radius of the gradient.
        @method
        @param value - The new radius of the gradient.
        */
        radius(value: number): void;
        /**
        Removes a color stop from the gradient.
Inherited from Gradient.removeStop
        @method
        @param stop - The gradient color stop to remove.
        */
        removeStop(stop: kendo.drawing.GradientStop): void;

    }

    interface RadialGradientOptions {
        name?: string;
        /**
        The center of the gradient.Coordinates are relative to the shape bounding box.
For example [0, 0] is top left and [1, 1] is bottom right.
        @member {any|kendo.geometry.Point}
        */
        center?: any|kendo.geometry.Point;
        /**
        The radius of the radial gradient relative to the shape bounding box.
        @member {number}
        */
        radius?: number;
        /**
        The color stops of the gradient.
Can contain either plain objects or GradientStop instances.
        @member {any}
        */
        stops?: any;
    }
    interface RadialGradientEvent {
        sender: RadialGradient;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Rect extends kendo.drawing.Element {


        options: RectOptions;


        constructor(geometry: kendo.geometry.Rect, options?: RectOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the rectangle geometry.
        @method
        @returns The current rectangle geometry.
        */
        geometry(): kendo.geometry.Rect;
        /**
        Gets or sets the rectangle geometry.
        @method
        @param value - The new geometry to use.
        */
        geometry(value: kendo.geometry.Rect): void;
        /**
        Sets the shape fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Rect;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Sets the shape stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Rect;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface RectOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the shape.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the shape.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface RectEvent {
        sender: Rect;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Segment extends kendo.Class {


        options: SegmentOptions;


        constructor(anchor: kendo.geometry.Point, controlIn: kendo.geometry.Point, controlOut: kendo.geometry.Point);


        /**
        Gets or sets the segment anchor point.The setter returns the current Segment to allow chaining.
        @method
        @returns The current anchor point.
        */
        anchor(): kendo.geometry.Point;
        /**
        Gets or sets the segment anchor point.The setter returns the current Segment to allow chaining.
        @method
        @param value - The new anchor point.
        */
        anchor(value: kendo.geometry.Point): void;
        /**
        Gets or sets the first curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @returns The current control point.
        */
        controlIn(): kendo.geometry.Point;
        /**
        Gets or sets the first curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @param value - The new control point.
        */
        controlIn(value: kendo.geometry.Point): void;
        /**
        Gets or sets the second curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @returns The current control point.
        */
        controlOut(): kendo.geometry.Point;
        /**
        Gets or sets the second curve control point of this segment.The setter returns the current Segment to allow chaining.
        @method
        @param value - The new control point.
        */
        controlOut(value: kendo.geometry.Point): void;

    }

    interface SegmentOptions {
        name?: string;
    }
    interface SegmentEvent {
        sender: Segment;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    interface StrokeOptions  {



        /**
                The stroke color in any of the following formats.| Value          | Description
| ---            | --- | ---
| red            | Basic or Extended CSS Color name
| #ff0000        | Hex RGB value
| rgb(255, 0, 0) | RGB valueSpecifying 'none', 'transparent' or '' (empty string) will clear the stroke.
                */
                color?: string;
        /**
                The stroke dash type.| Value            |                                              | Description
| ---              | :---:                                        | ---
| dash           |               | a line consisting of dashes
| dashDot        |           | a line consisting of a repeating pattern of dash-dot
| dot            |                | a line consisting of dots
| longDash       |          | a line consisting of a repeating pattern of long-dash
| longDashDot    |      | a line consisting of a repeating pattern of long-dash dot
| longDashDotDot |  | a line consisting of a repeating pattern of long-dash dot-dot
| solid          |              | a solid line
                */
                dashType?: string;
        /**
                The stroke line cap style.| Value    |                                     | Description
| ---      | :---:                               | ---
| butt   |    | a flat edge with no cap
| round  |   | a rounded cap
| square |  | a square cap
                */
                lineCap?: string;
        /**
                The stroke line join style.| Value   |                                     | Description
| ---     | :---:                               | ---
| bevel |  | a beveled join
| miter |  | a square join
| round |  | a rounded join
                */
                lineJoin?: string;
        /**
                The stroke opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
                */
                opacity?: number;
        /**
                The stroke width in pixels.
                */
                width?: number;




    }



    class Surface extends kendo.Observable {


        options: SurfaceOptions;


        constructor(options?: SurfaceOptions);

        static create(element: JQuery, options?: any): kendo.drawing.Surface;
        static create(element: Element, options?: any): kendo.drawing.Surface;

        /**
        Clears the drawing surface.
        @method
        */
        clear(): void;
        /**
        Draws the element and its children on the surface.
Existing elements will remain visible.
        @method
        @param element - The element to draw.
        */
        draw(element: kendo.drawing.Element): void;
        /**
        Returns the target drawing element of a DOM event.
        @method
        @param e - The original DOM or jQuery event object.
        @returns The target drawing element, if any.
        */
        eventTarget(e: any): kendo.drawing.Element;
        /**
        Resizes the surface to match the size of the container.
        @method
        @param force - Whether to proceed with resizing even if the container dimensions have not changed.
        */
        resize(force?: boolean): void;

    }

    interface SurfaceOptions {
        name?: string;
        /**
        The preferred type of surface to create.
Supported types (case insensitive):
- svg
- canvas
- vmlThis option will be ignored if not supported by the browser.
See Supported Browsers.
        @member {string}
        */
        type?: string;
        /**
        The height of the surface element.
By default the surface will expand to fill the height of the first positioned container.
        @member {string}
        */
        height?: string;
        /**
        The width of the surface element.
By default the surface will expand to fill the width of the first positioned container.
        @member {string}
        */
        width?: string;
        /**
        Triggered when an element has been clicked.
        */
        click?(e: SurfaceClickEvent): void;
        /**
        Triggered when the mouse is moved over an element.
        */
        mouseenter?(e: SurfaceMouseenterEvent): void;
        /**
        Triggered when the mouse is leaves an element.
        */
        mouseleave?(e: SurfaceMouseleaveEvent): void;
    }
    interface SurfaceEvent {
        sender: Surface;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }

    interface SurfaceClickEvent extends SurfaceEvent {
        /**
        The clicked element.
        @member {kendo.drawing.Element}
        */
        element?: kendo.drawing.Element;
        /**
        The browser event that triggered the click.
        @member {any}
        */
        originalEvent?: any;
    }

    interface SurfaceMouseenterEvent extends SurfaceEvent {
        /**
        The target element.
        @member {kendo.drawing.Element}
        */
        element?: kendo.drawing.Element;
        /**
        The browser event that triggered the click.
        @member {any}
        */
        originalEvent?: any;
    }

    interface SurfaceMouseleaveEvent extends SurfaceEvent {
        /**
        The target element.
        @member {kendo.drawing.Element}
        */
        element?: kendo.drawing.Element;
        /**
        The browser event that triggered the click.
        @member {any}
        */
        originalEvent?: any;
    }


    class Text extends kendo.drawing.Element {


        options: TextOptions;


        constructor(content: string, position: kendo.geometry.Point, options?: TextOptions);


        /**
        Returns the bounding box of the element with transformations applied.
Inherited from Element.bbox
        @method
        @returns The bounding box of the element with transformations applied.
        */
        bbox(): kendo.geometry.Rect;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @returns The current element clipping path.
        */
        clip(): kendo.drawing.Path;
        /**
        Gets or sets the element clipping path.
Inherited from Element.clip
        @method
        @param clip - The element clipping path.
        */
        clip(clip: kendo.drawing.Path): void;
        /**
        Returns the bounding box of the element with clipping and transformations applied.
Inherited from Element.clippedBBox
        @method
        @returns The bounding box of the element with clipping transformations applied.
        */
        clippedBBox(): kendo.geometry.Rect;
        /**
        Gets or sets the text content.
        @method
        @returns The current content of the text.
        */
        content(): string;
        /**
        Gets or sets the text content.
        @method
        @param value - The new text content to set.
        */
        content(value: string): void;
        /**
        Sets the text fill.
        @method
        @param color - The fill color to set.
        @param opacity - The fill opacity to set.
        @returns The current instance to allow chaining.
        */
        fill(color: string, opacity?: number): kendo.drawing.Text;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @returns The current element opacity.
        */
        opacity(): number;
        /**
        Gets or sets the element opacity.
Inherited from Element.opacityIf set, the stroke and fill opacity will be multiplied by the element opacity.
        @method
        @param opacity - The element opacity. Ranges from 0 (completely transparent) to 1 (completely opaque).
        */
        opacity(opacity: number): void;
        /**
        Gets or sets the position of the text upper left corner.
        @method
        @returns The current position of the text upper left corner.
        */
        position(): kendo.geometry.Point;
        /**
        Gets or sets the position of the text upper left corner.
        @method
        @param value - The new position of the text upper left corner.
        */
        position(value: kendo.geometry.Point): void;
        /**
        Sets the text stroke.
        @method
        @param color - The stroke color to set.
        @param width - The stroke width to set.
        @param opacity - The stroke opacity to set.
        @returns The current instance to allow chaining.
        */
        stroke(color: string, width?: number, opacity?: number): kendo.drawing.Text;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @returns The current transformation on the element.
        */
        transform(): kendo.geometry.Transformation;
        /**
        Gets or sets the transformation of the element.
Inherited from Element.transform
        @method
        @param transform - The transformation to apply to the element.
        */
        transform(transform: kendo.geometry.Transformation): void;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @returns true if the element is visible; false otherwise.
        */
        visible(): boolean;
        /**
        Gets or sets the visibility of the element.
Inherited from Element.visible
        @method
        @param visible - A flag indicating if the element should be visible.
        */
        visible(visible: boolean): void;

    }

    interface TextOptions {
        name?: string;
        /**
        The element clipping path.
Inherited from Element.clip
        @member {kendo.drawing.Path}
        */
        clip?: kendo.drawing.Path;
        /**
        The element cursor.
Inherited from Element.cursor
        @member {string}
        */
        cursor?: string;
        /**
        The fill options of the text.
        @member {kendo.drawing.FillOptions}
        */
        fill?: kendo.drawing.FillOptions;
        /**
        The font to use for rendering the text.
Accepts the standard CSS font syntax.Examples of valid font values:
* Size and family: "2em 'Open Sans', sans-serif"
* Style, size and family: "italic 2em 'Open Sans', sans-serif"
        @member {string}
        */
        font?: string;
        /**
        The element opacity.
Inherited from Element.opacity
        @member {number}
        */
        opacity?: number;
        /**
        The stroke options of the text.
        @member {kendo.drawing.StrokeOptions}
        */
        stroke?: kendo.drawing.StrokeOptions;
        /**
        The transformation to apply to this element.
Inherited from Element.transform
        @member {kendo.geometry.Transformation}
        */
        transform?: kendo.geometry.Transformation;
        /**
        A flag, indicating if the element is visible.
Inherited from Element.visible
        @member {boolean}
        */
        visible?: boolean;
    }
    interface TextEvent {
        sender: Text;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


}
declare module kendo.dataviz.geometry {
    class Arc extends Observable {


        options: ArcOptions;

        /**
                A flag indicating if the arc should be drawn in clockwise or anticlockwise direction.
Defaults to clockwise direction.
                */
                anticlockwise: boolean;
        /**
                The location of the arc center.
                */
                center: kendo.geometry.Point;
        /**
                The end angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
                */
                endAngle: number;
        /**
                The x radius of the arc.
                */
                radiusX: number;
        /**
                The y radius of the arc.
                */
                radiusY: number;
        /**
                The start angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
                */
                startAngle: number;



        /**
        Returns the bounding box of this arc after applying the specified transformation matrix.
        @method
        @param matrix - Transformation matrix to apply.
        @returns The bounding box after applying the transformation matrix.
        */
        bbox(matrix: kendo.geometry.Matrix): kendo.geometry.Rect;
        /**
        Gets the arc anticlokwise flag.
        @method
        @returns The anticlokwise flag of the arc.
        */
        getAnticlockwise(): boolean;
        /**
        Gets the arc center location.
        @method
        @returns The location of the arc center.
        */
        getCenter(): kendo.geometry.Point;
        /**
        Gets the end angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @returns The end angle of the arc.
        */
        getEndAngle(): number;
        /**
        Gets the x radius of the arc.
        @method
        @returns The x radius of the arc.
        */
        getRadiusX(): number;
        /**
        Gets the y radius of the arc.
        @method
        @returns The y radius of the arc.
        */
        getRadiusY(): number;
        /**
        Gets the start angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @returns The start angle of the arc.
        */
        getStartAngle(): number;
        /**
        Gets the location of a point on the arc's circumference at a given angle.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @returns The point on the arc's circumference.
        */
        pointAt(angle: number): kendo.geometry.Point;
        /**
        Sets the arc anticlokwise flag.
        @method
        @param value - The new anticlockwise value.
        @returns The current arc instance.
        */
        setAnticlockwise(value: boolean): kendo.geometry.Arc;
        /**
        Sets the arc center location.
        @method
        @param value - The new arc center.
        @returns The current arc instance.
        */
        setCenter(value: kendo.geometry.Point): kendo.geometry.Arc;
        /**
        Sets the end angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @param value - The new arc end angle.
        @returns The current arc instance.
        */
        setEndAngle(value: number): kendo.geometry.Arc;
        /**
        Sets the x radius of the arc.
        @method
        @param value - The new arc x radius.
        @returns The current arc instance.
        */
        setRadiusX(value: number): kendo.geometry.Arc;
        /**
        Sets the y radius of the arc.
        @method
        @param value - The new arc y radius.
        @returns The current arc instance.
        */
        setRadiusY(value: number): kendo.geometry.Arc;
        /**
        Sets the start angle of the arc in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
        @method
        @param value - The new arc atart angle.
        @returns The current arc instance.
        */
        setStartAngle(value: number): kendo.geometry.Arc;

    }

    interface ArcOptions {
        name?: string;
    }
    interface ArcEvent {
        sender: Arc;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Circle extends Observable {


        options: CircleOptions;

        /**
                The location of the circle center.
                */
                center: kendo.geometry.Point;
        /**
                The radius of the circle.
                */
                radius: number;



        /**
        Returns the bounding box of this circle after applying the
specified transformation matrix.
        @method
        @param matrix - Transformation matrix to apply.
        @returns The bounding box after applying the transformation matrix.
        */
        bbox(matrix: kendo.geometry.Matrix): kendo.geometry.Rect;
        /**
        Creates a new instance with the same center and radius.
        @method
        @returns A new Circle instance with the same center and radius.
        */
        clone(): kendo.geometry.Circle;
        /**
        Compares this circle with another instance.
        @method
        @param other - The circle to compare with.
        @returns true if the point coordinates match; false otherwise.
        */
        equals(other: kendo.geometry.Circle): boolean;
        /**
        Gets the circle center location.
        @method
        @returns The location of the circle center.
        */
        getCenter(): kendo.geometry.Point;
        /**
        Gets the circle radius.
        @method
        @returns The radius of the circle.
        */
        getRadius(): number;
        /**
        Gets the location of a point on the circle's circumference at a given angle.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @returns The point on the circle's circumference.
        */
        pointAt(angle: number): kendo.geometry.Point;
        /**
        Sets the location of the circle center.
        @method
        @param value - The new center Point or equivalent [x, y] array.
        @returns The location of the circle center.
        */
        setCenter(value: kendo.geometry.Point): kendo.geometry.Point;
        /**
        Sets the location of the circle center.
        @method
        @param value - The new center Point or equivalent [x, y] array.
        @returns The location of the circle center.
        */
        setCenter(value: any): kendo.geometry.Point;
        /**
        Sets the circle radius.
        @method
        @param value - The new circle radius.
        @returns The current circle instance.
        */
        setRadius(value: number): kendo.geometry.Circle;

    }

    interface CircleOptions {
        name?: string;
    }
    interface CircleEvent {
        sender: Circle;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Matrix extends Observable {


        options: MatrixOptions;

        /**
                The a (1, 1) member of the matrix.
                */
                a: number;
        /**
                The b (2, 1) member of the matrix.
                */
                b: number;
        /**
                The a (1, 2) member of the matrix.
                */
                c: number;
        /**
                The d (2, 2) member of the matrix.
                */
                d: number;
        /**
                The e (1, 3) member of the matrix.
                */
                e: number;
        /**
                The f (2, 3) member of the matrix.
                */
                f: number;


        static rotate(angle: number, x: number, y: number): kendo.geometry.Matrix;
        static scale(scaleX: number, scaleY: number): kendo.geometry.Matrix;
        static translate(x: number, y: number): kendo.geometry.Matrix;
        static unit(): kendo.geometry.Matrix;

        /**
        Creates a new instance with the same element values.
        @method
        @returns A new Matrix instance with the same element values.
        */
        clone(): kendo.geometry.Matrix;
        /**
        Compares this matrix with another instance.
        @method
        @param other - The matrix instance to compare with.
        @returns true if the matrix elements match; false otherwise.
        */
        equals(other: kendo.geometry.Matrix): boolean;
        /**
        Rounds the matrix elements to the specified number of fractional digits.
        @method
        @param digits - Number of fractional digits.
        @returns The current matrix instance.
        */
        round(digits: number): kendo.geometry.Matrix;
        /**
        Multiplies the matrix with another one and returns the result as new instance.
The current instance elements are not altered.
        @method
        @param matrix - The matrix to multiply by.
        @returns The result of the multiplication.
        */
        multiplyCopy(matrix: kendo.geometry.Matrix): kendo.geometry.Matrix;
        /**
        Returns the matrix elements as an [a, b, c, d, e, f] array.
        @method
        @param digits - (Optional) Number of fractional digits.
        @returns An array representation of the matrix.
        */
        toArray(digits: number): any;
        /**
        Formats the matrix elements as a string.
        @method
        @param digits - (Optional) Number of fractional digits.
        @param separator - The separator to place between elements.
        @returns A string representation of the matrix, e.g. "1, 0, 0, 1, 0, 0".
        */
        toString(digits: number, separator: string): string;

    }

    interface MatrixOptions {
        name?: string;
    }
    interface MatrixEvent {
        sender: Matrix;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Point extends Observable {


        options: PointOptions;

        /**
                The x coordinate of the point.
                */
                x: number;
        /**
                The y coordinate of the point.
                */
                y: number;

        constructor(x: number, y: number);

        static create(x: number, y: number): kendo.geometry.Point;
        static create(x: any, y: number): kendo.geometry.Point;
        static create(x: kendo.geometry.Point, y: number): kendo.geometry.Point;
        static min(): kendo.geometry.Point;
        static max(): kendo.geometry.Point;
        static minPoint(): kendo.geometry.Point;
        static maxPoint(): kendo.geometry.Point;

        /**
        Creates a new instance with the same coordinates.
        @method
        @returns A new Point instance with the same coordinates.
        */
        clone(): kendo.geometry.Point;
        /**
        Calculates the distance to another point.
        @method
        @param point - The point to calculate the distance to.
        @returns The straight line distance to the given point.
        */
        distanceTo(point: kendo.geometry.Point): number;
        /**
        Compares this point with another instance.
        @method
        @param other - The point to compare with.
        @returns true if the point coordinates match; false otherwise.
        */
        equals(other: kendo.geometry.Point): boolean;
        /**
        Gets the x coordinate value.
        @method
        @returns The current x coordinate value.
        */
        getX(): number;
        /**
        Gets the y coordinate value.
        @method
        @returns The current y coordinate value.
        */
        getY(): number;
        /**
        Moves the point to the specified x and y coordinates.
        @method
        @param x - The new X coordinate.
        @param y - The new Y coordinate.
        @returns The current point instance.
        */
        move(x: number, y: number): kendo.geometry.Point;
        /**
        Rotates the point around the given center.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The rotation center. Can be a Point instance or an [x, y] array.
        @returns The current Point instance.
        */
        rotate(angle: number, center: kendo.geometry.Point): kendo.geometry.Point;
        /**
        Rotates the point around the given center.
        @method
        @param angle - Angle in decimal degrees. Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The rotation center. Can be a Point instance or an [x, y] array.
        @returns The current Point instance.
        */
        rotate(angle: number, center: any): kendo.geometry.Point;
        /**
        Rounds the point coordinates to the specified number of fractional digits.
        @method
        @param digits - Number of fractional digits.
        @returns The current Point instance.
        */
        round(digits: number): kendo.geometry.Point;
        /**
        Scales the point coordinates along the x and y axis.
        @method
        @param scaleX - The x scale multiplier.
        @param scaleY - The y scale multiplier.
        @returns The current point instance.
        */
        scale(scaleX: number, scaleY: number): kendo.geometry.Point;
        /**
        Scales the point coordinates on a copy of the current point.
The callee coordinates will remain unchanged.
        @method
        @param scaleX - The x scale multiplier.
        @param scaleY - The y scale multiplier.
        @returns The new Point instance.
        */
        scaleCopy(scaleX: number, scaleY: number): kendo.geometry.Point;
        /**
        Sets the x coordinate to a new value.
        @method
        @param value - The new x coordinate value.
        @returns The current Point instance.
        */
        setX(value: number): kendo.geometry.Point;
        /**
        Sets the y coordinate to a new value.
        @method
        @param value - The new y coordinate value.
        @returns The current Point instance.
        */
        setY(value: number): kendo.geometry.Point;
        /**
        Returns the point coordinates as an [x, y] array.
        @method
        @param digits - (Optional) Number of fractional digits.
        @returns An array representation of the point, e.g. [10, 20]
        */
        toArray(digits: number): any;
        /**
        Formats the point value to a string.
        @method
        @param digits - (Optional) Number of fractional digits.
        @param separator - The separator to place between coordinates.
        @returns A string representation of the point, e.g. "10 20".
        */
        toString(digits: number, separator: string): string;
        /**
        Applies a transformation to the point coordinates.
The current coordinates will be overriden.
        @method
        @param tansformation - The transformation to apply.
        @returns The current Point instance.
        */
        transform(tansformation: kendo.geometry.Transformation): kendo.geometry.Point;
        /**
        Applies a transformation on a copy of the current point.
The callee coordinates will remain unchanged.
        @method
        @param tansformation - The transformation to apply.
        @returns The new Point instance.
        */
        transformCopy(tansformation: kendo.geometry.Transformation): kendo.geometry.Point;
        /**
        Translates the point along the x and y axis.
        @method
        @param dx - The distance to move along the X axis.
        @param dy - The distance to move along the Y axis.
        @returns The current point instance.
        */
        translate(dx: number, dy: number): kendo.geometry.Point;
        /**
        Translates the point by using a Point instance as a vector of translation.
        @method
        @param vector - The vector of translation. Can be either a Point instance or an [x, y] array.
        @returns The current point instance.
        */
        translateWith(vector: kendo.geometry.Point): kendo.geometry.Point;
        /**
        Translates the point by using a Point instance as a vector of translation.
        @method
        @param vector - The vector of translation. Can be either a Point instance or an [x, y] array.
        @returns The current point instance.
        */
        translateWith(vector: any): kendo.geometry.Point;

    }

    interface PointOptions {
        name?: string;
    }
    interface PointEvent {
        sender: Point;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Rect extends Observable {


        options: RectOptions;

        /**
                The origin (top-left corner) of the rectangle.
                */
                origin: kendo.geometry.Point;
        /**
                The size of the rectangle.
                */
                size: kendo.geometry.Size;

        constructor(origin: kendo.geometry.Point, size: kendo.geometry.Size);

        static fromPoints(pointA: kendo.geometry.Point, pointB: kendo.geometry.Point): kendo.geometry.Rect;
        static union(rectA: kendo.geometry.Rect, rectB: kendo.geometry.Rect): kendo.geometry.Rect;

        /**
        Returns the bounding box of this rectangle after applying the
specified transformation matrix.
        @method
        @param matrix - Transformation matrix to apply.
        @returns The bounding box after applying the transformation matrix.
        */
        bbox(matrix: kendo.geometry.Matrix): kendo.geometry.Rect;
        /**
        Gets the position of the bottom-left corner of the rectangle.
This is also the rectangle origin
        @method
        @returns The position of the bottom-left corner.
        */
        bottomLeft(): kendo.geometry.Point;
        /**
        Gets the position of the bottom-right corner of the rectangle.
        @method
        @returns The position of the bottom-right corner.
        */
        bottomRight(): kendo.geometry.Point;
        /**
        Gets the position of the center of the rectangle.
        @method
        @returns The position of the center.
        */
        center(): kendo.geometry.Point;
        /**
        Creates a new instance with the same origin and size.
        @method
        @returns A new Rect instance with the same origin and size.
        */
        clone(): kendo.geometry.Rect;
        /**
        Compares this rectangle with another instance.
        @method
        @param other - The rectangle to compare with.
        @returns true if the origin and size is the same for both rectangles; false otherwise.
        */
        equals(other: kendo.geometry.Rect): boolean;
        /**
        Gets the origin (top-left point) of the rectangle.
        @method
        @returns The origin (top-left point).
        */
        getOrigin(): kendo.geometry.Point;
        /**
        Gets the rectangle size.
        @method
        @returns The current rectangle Size.
        */
        getSize(): kendo.geometry.Size;
        /**
        Gets the rectangle height.
        @method
        @returns The rectangle height.
        */
        height(): number;
        /**
        Sets the origin (top-left point) of the rectangle.
        @method
        @param value - The new origin Point or equivalent [x, y] array.
        @returns The current rectangle instance.
        */
        setOrigin(value: kendo.geometry.Point): kendo.geometry.Rect;
        /**
        Sets the origin (top-left point) of the rectangle.
        @method
        @param value - The new origin Point or equivalent [x, y] array.
        @returns The current rectangle instance.
        */
        setOrigin(value: any): kendo.geometry.Rect;
        /**
        Sets the rectangle size.
        @method
        @param value - The new rectangle Size or equivalent [width, height] array.
        @returns The current rectangle instance.
        */
        setSize(value: kendo.geometry.Size): kendo.geometry.Rect;
        /**
        Sets the rectangle size.
        @method
        @param value - The new rectangle Size or equivalent [width, height] array.
        @returns The current rectangle instance.
        */
        setSize(value: any): kendo.geometry.Rect;
        /**
        Gets the position of the top-left corner of the rectangle.
This is also the rectangle origin
        @method
        @returns The position of the top-left corner.
        */
        topLeft(): kendo.geometry.Point;
        /**
        Gets the position of the top-right corner of the rectangle.
        @method
        @returns The position of the top-right corner.
        */
        topRight(): kendo.geometry.Point;
        /**
        Gets the rectangle width.
        @method
        @returns The rectangle width.
        */
        width(): number;

    }

    interface RectOptions {
        name?: string;
    }
    interface RectEvent {
        sender: Rect;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Size extends Observable {


        options: SizeOptions;

        /**
                The horizontal size.
                */
                width: number;
        /**
                The vertical size.
                */
                height: number;


        static create(width: number, height: number): kendo.geometry.Size;
        static create(width: any, height: number): kendo.geometry.Size;
        static create(width: kendo.geometry.Size, height: number): kendo.geometry.Size;

        /**
        Creates a new instance with the same width and height.
        @method
        @returns A new Size instance with the same coordinates.
        */
        clone(): kendo.geometry.Size;
        /**
        Compares this Size with another instance.
        @method
        @param other - The Size to compare with.
        @returns true if the size members match; false otherwise.
        */
        equals(other: kendo.geometry.Size): boolean;
        /**
        Gets the width value.
        @method
        @returns The current width value.
        */
        getWidth(): number;
        /**
        Gets the height value.
        @method
        @returns The current height value.
        */
        getHeight(): number;
        /**
        Sets the width to a new value.
        @method
        @param value - The new width value.
        @returns The current Size instance.
        */
        setWidth(value: number): kendo.geometry.Size;
        /**
        Sets the height to a new value.
        @method
        @param value - The new height value.
        @returns The current Size instance.
        */
        setHeight(value: number): kendo.geometry.Size;

    }

    interface SizeOptions {
        name?: string;
    }
    interface SizeEvent {
        sender: Size;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


    class Transformation extends Observable {


        options: TransformationOptions;




        /**
        Creates a new instance with the same transformation matrix.
        @method
        @returns A new Transformation instance with the same matrix.
        */
        clone(): kendo.geometry.Transformation;
        /**
        Compares this transformation with another instance.
        @method
        @param other - The transformation to compare with.
        @returns true if the transformation matrix is the same; false otherwise.
        */
        equals(other: kendo.geometry.Transformation): boolean;
        /**
        Gets the current transformation matrix for this transformation.
        @method
        @returns The current transformation matrix.
        */
        matrix(): kendo.geometry.Matrix;
        /**
        Multiplies the transformation with another.
The underlying transformation matrix is updated in-place.
        @method
        @param transformation - The transformation to multiply by.
        @returns The current transformation instance.
        */
        multiply(transformation: kendo.geometry.Transformation): kendo.geometry.Transformation;
        /**
        Sets rotation with the specified parameters.
        @method
        @param angle - The angle of rotation in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The center of rotation.
        @returns The current transformation instance.
        */
        rotate(angle: number, center: any): kendo.geometry.Transformation;
        /**
        Sets rotation with the specified parameters.
        @method
        @param angle - The angle of rotation in decimal degrees.
Measured in clockwise direction with 0 pointing "right".
Negative values or values greater than 360 will be normalized.
        @param center - The center of rotation.
        @returns The current transformation instance.
        */
        rotate(angle: number, center: kendo.geometry.Point): kendo.geometry.Transformation;
        /**
        Sets scale with the specified parameters.
        @method
        @param scaleX - The scale factor on the X axis.
        @param scaleY - The scale factor on the Y axis.
        @returns The current transformation instance.
        */
        scale(scaleX: number, scaleY: number): kendo.geometry.Transformation;
        /**
        Sets translation with the specified parameters.
        @method
        @param x - The distance to translate along the X axis.
        @param y - The distance to translate along the Y axis.
        @returns The current transformation instance.
        */
        translate(x: number, y: number): kendo.geometry.Transformation;

    }

    interface TransformationOptions {
        name?: string;
    }
    interface TransformationEvent {
        sender: Transformation;
        preventDefault: Function;
        isDefaultPrevented(): boolean;
    }


}

interface HTMLElement {
    kendoBindingTarget: kendo.data.BindingTarget;
}

interface JQueryXHR {
}

interface JQueryEventObject {
}

interface JQueryPromise<T> {
}

interface JQuery {

    kendoDraggable(): JQuery;
    kendoDraggable(options: kendo.ui.DraggableOptions): JQuery;

    kendoDropTarget(): JQuery;
    kendoDropTarget(options: kendo.ui.DropTargetOptions): JQuery;

    kendoDropTargetArea(): JQuery;
    kendoDropTargetArea(options: kendo.ui.DropTargetAreaOptions): JQuery;

    data(key: any): any;

    kendoMobileActionSheet(): JQuery;
    kendoMobileActionSheet(options: kendo.mobile.ui.ActionSheetOptions): JQuery;
    data(key: "kendoMobileActionSheet"): kendo.mobile.ui.ActionSheet;

    kendoMobileBackButton(): JQuery;
    kendoMobileBackButton(options: kendo.mobile.ui.BackButtonOptions): JQuery;
    data(key: "kendoMobileBackButton"): kendo.mobile.ui.BackButton;

    kendoMobileButton(): JQuery;
    kendoMobileButton(options: kendo.mobile.ui.ButtonOptions): JQuery;
    data(key: "kendoMobileButton"): kendo.mobile.ui.Button;

    kendoMobileButtonGroup(): JQuery;
    kendoMobileButtonGroup(options: kendo.mobile.ui.ButtonGroupOptions): JQuery;
    data(key: "kendoMobileButtonGroup"): kendo.mobile.ui.ButtonGroup;

    kendoMobileCollapsible(): JQuery;
    kendoMobileCollapsible(options: kendo.mobile.ui.CollapsibleOptions): JQuery;
    data(key: "kendoMobileCollapsible"): kendo.mobile.ui.Collapsible;

    kendoMobileDetailButton(): JQuery;
    kendoMobileDetailButton(options: kendo.mobile.ui.DetailButtonOptions): JQuery;
    data(key: "kendoMobileDetailButton"): kendo.mobile.ui.DetailButton;

    kendoMobileDrawer(): JQuery;
    kendoMobileDrawer(options: kendo.mobile.ui.DrawerOptions): JQuery;
    data(key: "kendoMobileDrawer"): kendo.mobile.ui.Drawer;

    kendoMobileLayout(): JQuery;
    kendoMobileLayout(options: kendo.mobile.ui.LayoutOptions): JQuery;
    data(key: "kendoMobileLayout"): kendo.mobile.ui.Layout;

    kendoMobileListView(): JQuery;
    kendoMobileListView(options: kendo.mobile.ui.ListViewOptions): JQuery;
    data(key: "kendoMobileListView"): kendo.mobile.ui.ListView;

    kendoMobileLoader(): JQuery;
    kendoMobileLoader(options: kendo.mobile.ui.LoaderOptions): JQuery;
    data(key: "kendoMobileLoader"): kendo.mobile.ui.Loader;

    kendoMobileModalView(): JQuery;
    kendoMobileModalView(options: kendo.mobile.ui.ModalViewOptions): JQuery;
    data(key: "kendoMobileModalView"): kendo.mobile.ui.ModalView;

    kendoMobileNavBar(): JQuery;
    kendoMobileNavBar(options: kendo.mobile.ui.NavBarOptions): JQuery;
    data(key: "kendoMobileNavBar"): kendo.mobile.ui.NavBar;

    kendoMobilePane(): JQuery;
    kendoMobilePane(options: kendo.mobile.ui.PaneOptions): JQuery;
    data(key: "kendoMobilePane"): kendo.mobile.ui.Pane;

    kendoMobilePopOver(): JQuery;
    kendoMobilePopOver(options: kendo.mobile.ui.PopOverOptions): JQuery;
    data(key: "kendoMobilePopOver"): kendo.mobile.ui.PopOver;

    kendoMobileScrollView(): JQuery;
    kendoMobileScrollView(options: kendo.mobile.ui.ScrollViewOptions): JQuery;
    data(key: "kendoMobileScrollView"): kendo.mobile.ui.ScrollView;

    kendoMobileScroller(): JQuery;
    kendoMobileScroller(options: kendo.mobile.ui.ScrollerOptions): JQuery;
    data(key: "kendoMobileScroller"): kendo.mobile.ui.Scroller;

    kendoMobileSplitView(): JQuery;
    kendoMobileSplitView(options: kendo.mobile.ui.SplitViewOptions): JQuery;
    data(key: "kendoMobileSplitView"): kendo.mobile.ui.SplitView;

    kendoMobileSwitch(): JQuery;
    kendoMobileSwitch(options: kendo.mobile.ui.SwitchOptions): JQuery;
    data(key: "kendoMobileSwitch"): kendo.mobile.ui.Switch;

    kendoMobileTabStrip(): JQuery;
    kendoMobileTabStrip(options: kendo.mobile.ui.TabStripOptions): JQuery;
    data(key: "kendoMobileTabStrip"): kendo.mobile.ui.TabStrip;

    kendoMobileView(): JQuery;
    kendoMobileView(options: kendo.mobile.ui.ViewOptions): JQuery;
    data(key: "kendoMobileView"): kendo.mobile.ui.View;

    kendoTouch(): JQuery;
    kendoTouch(options: kendo.ui.TouchOptions): JQuery;
    data(key: "kendoTouch"): kendo.ui.Touch;

}
