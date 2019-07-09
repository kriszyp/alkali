declare namespace alkali {
  type KeyType = string | number
  interface Promise<T> {
    then<U>(callback?: (value: T) => U | Promise<U>, errback?: (value: T) => U | Promise<U>): Promise<U>
  }

  export class UpdateEvent {
    visited: Set<Variable<any>>
    version?: number
    type: ('replaced' | 'property' | 'added' | 'deleted' | 'entry' | 'spliced' | 'discovered')
    child?: UpdateEvent
    triggers?: any[]
    sources?: Set<any>
    source: any
  }

  // support heterogenous inputs https://github.com/Microsoft/TypeScript/pull/26063
  type YieldedValue<T> = T extends Variable<infer U> ? U : T
  type Yield<T> = { [P in keyof T]: YieldedValue<T[P]> }

  interface Subscription {
    unsubscribe(): void
  }

  export class Variable<T = {}> implements Promise<T> {
    /**
    * Create a new Variable, with reactive capabilities, that holds a varying value.
    * @param value Initial value for variable
    */
    constructor(value?: T | Promise<T> | Variable<T>)
    /**
    * Gets the current value of the variable.
    * Note that this always returns synchronously, and if the variable has been provided a promise that has not resolved yet, will return last value
    */
    valueOf(): T
    /**
    * Listen for the value of the variable, waiting if necessary, for any dependent promises to resolve. If the variable has a synchronously available value, the callback will be called immediately/synchronously
    */
    then<U>(callback?: (value: T) => U | Promise<U>, errback?: (value: T) => U | Promise<U>): Promise<U>
    /**
    * Returns a variable corresponding to the property of the value of this variable
    * @param key The name of the property
    */
    property<K extends keyof T>(key: K): Variable<YieldedValue<T[K]>>
    property<U>(key: KeyType, PropertyClass: { new(): U }): U
    /**
    * Assigns a new value to this variables (which marks it as updated and any listeners will be notified). This is a request to change the variable, and subclasses can reject the put request, or return asynchronously.
    * @param value The new value to assign to the variable. The may be another variable or a promise, which will transitively be resolved
    */
    put(value: T | Variable<T> | Promise<T>, event?: UpdateEvent): T | Variable<T> | Promise<T>
    /**
    * Gets the property value of this variable's value/object. This differs from `property` in that it returns the resolved value, not a variable
    * @param key The name of the property
    */
    get<K extends keyof T>(key: K): YieldedValue<T[K]>
    /**
    * Assigns a value to the property of this variable's value
    * @param key The name of the property
    * @param value The new value to assign to the property
    */
    set<K extends keyof T>(key: K, value: T[K] | Variable<T[K]> | Promise<T[K]>, event?: UpdateEvent): void
    /**
    * Assigns undefined to the property of this variable's value
    * @param key The name of the property
    */
    undefine(key: KeyType): void
    /**
    * Define the value of this variable. This can be used to indicate that the some
    * @param variable The variable to proxy
    */
    is(variable: Variable<T>): this
    for(subject: any): this
    /**
    * Creates a new variable that is a transform of this variable, using the provided function to compute
    * the value of the new variable based on this variable's value. The returned variable is reactively dependent
    * on this variable. Note that this is computed lazily/as-needed, the transform function is not guaranteed to
    * execute on every change, only as needed by consumers.
    * @param transform The transform function to use to compute the value of the returned variable
    * @param reverseTransform The reverse transform function that is called when a value is put/set into the returned transform variable
    */
    to<U>(transform: (value: T) => Variable<U> | Promise<U> | U, reverseTransform?: (transformed: U) => any): Variable<U>
    /**
    * Indicate that the variable's value has changed (primarily used if the value has been mutated outside the alkali API, and alkali needs to be notified of the change)
    * @param event An event object can be provided that will be passed to all variables that are updated/invalidated by this event
    */
    updated(event?: UpdateEvent): UpdateEvent
    /**
    * Listen to the variable, and receive notification of update events
    * @param listener The listener object that will be called with data events. This will be called synchronously/immediately as part of the event dispatching.
    */
    notifies(listener: { updated: (event: UpdateEvent) => any }): void
    /**
    * Subscribe to the variable, calling the listener after changes to the variable's value.
    * @param listener The listener function that will be called after data changes. This will be called on the next micro-turn.
    */
    subscribe(listener: (event: { value:() => T }) => any): Subscription
    /**
    * Subscribe to the variable, calling the `next` method after changes to the variable's value.
    * @param listener The listener function that will be called immediately/synchronously after data changes.
    */
    subscribe(observable: { next: (value: T) => any}): Subscription
    /**
    * Cast the variable to the provided type
    * @param Type
    */
    as<U>(Type: { new(): U }): U
    /**
    * Returns a new variable that is sourced from `this` variable and when the source
    * returns asynchronously (an upstream promise), this will immediately return
    * the `valueUntilResolved` until the `this` variable is resolved (and which point
    * it will update and return that source value)
    * @param valueUntilResolved The value to return while waiting for the source value to resolve
    * @param useLastValue whether to use the last resolved value until the next resolution
    */
    whileResolving<U>(valueUntilResolved: U, useLastValue?: boolean): Variable<T | U>

    /**
    * Compose a new variable based on the provided input variables. The returned variable will hold an array
    * with elements corresponding to the values of the input variables, and will update in response to changes
    * to any of the input variables
    * @param inputs input variables
    */
    static all<T extends any[]>(inputs: T): Variable<Yield<T>>
    static all<T extends any[], U>(inputs: T, transform: (...v: Yield<T>) => U): Variable<U>
    /**
    * Compose a new variable based on the provided input variables. The returned variable will hold an array
    * with elements corresponding to the values of the input variables, and will update in response to changes
    * to any of the input variables
    * @param inputs input variables
    */
    static all<T extends any[]>(...inputs: T): Variable<Yield<T>>

    static with<V, Props>(this: V, properties: {[P in keyof Props]: Props[P]}): {
        new (...args: any[]): V & Reacts<Props>
    } & V & Reacts<Props>

    static assign<U>(properties: {[P in keyof U]: { new(): U[P] }}): VariableClass<U>

    schema: Variable
    validation: Variable

    collection: VariableClass
  }
  export interface VariableClass<T = {}, T2 = {}> {
    new(): Variable<T2> & T
    new(value?: T2): Variable<T2> & T
    <U>(properties: {[P in keyof U]: { new (): U[P] }}): VariableClass<T & U>
    with<U, V extends this>(properties: {[P in keyof U]: { new (): U[P] }}): VariableClass<T & U & V>
    assign<U>(properties: {[P in keyof U]: { new (): U[P] }}): VariableClass<T & U>
    hasOwn(Target: () => any): void

    put(value: T | Variable<T> | Promise<T>): T | Variable<T> | Promise<T>
    valueOf(): T
    then<U>(callback: (value: T) => U | Promise<U>, errback: (value: T) => U | Promise<U>): Promise<U>
    for(subject: any): Variable<T2>
    to<U>(transform: (value: T) => U | Variable<U>): VariableClass<U>
    property<K extends keyof T2>(key: K): VariableClass<T2[K]>
  }

  export type Reacts<T> = {[P in keyof T]?: Reacts<T[P]>} & Variable<T>

  interface VC<U> {
    <T>(properties: T): T & U & VC<T & U>
    new (properties: U): Variable<U>
  }

  export class VArray<T = {}> extends Variable<Array<T>> implements Set<T> {
    constructor(value?: Array<T> | Promise<Array<T>> | Variable<Array<T>>)
    readonly length: typeof VNumber
    /**
    * Return a VArray with the map applied
    */
    map<U>(transform: (value: T) => U): VArray<U>
    /**
    * Return a VArray with the filter applied
    */
    filter(filterFunction: (value: T) => any): VArray<T>
    /**
    * Iterate over the current value of the variable array
    */
    //@ts-ignore
    forEach(each: (value: T, index: number, collection: Array<T>) => {})
    /**
    * Return a Variable with the reduce applied
    */
    reduce<I = any, U = I>(reducer: (memo: I, value: T, index: number) => U, initialValue?: I): Variable<U>
    /**
    * Return a Variable with the reduceRight applied
    */
    reduceRight<I = any, U = I>(reducer: (memo: I, value: T, index: number) => U, initialValue?: I): Variable<U>
    /**
    * Return a Variable with the some method applied
    */
    some(filter: (value: T) => any): Variable<boolean>
    /**
    * Return a Variable with the every method applied
    */
    every(filter: (value: T) => any): Variable<boolean>
    /**
    * Return a VArray with the slice applied
    */
    slice(start: number, end?:number): Variable<T>
    /**
    * Push a new value on to the array
    */
    push(...items: any[]): number
    unshift(...items: any[]): number
    pop(): T
    shift(): T
    splice(start: number, end: number, ...items: any[]): T[]

    remove(item: T): void
    //@ts-ignore
    add(value: T): void
    //@ts-ignore
    delete(value: T): this
    has(value: T): boolean
    includes(searchElement: T): boolean

    static of: {
      /*<T, U extends Variable<T>>(collectionOf: { new (): U }): { new(v?: T[]): VArray<T, U> }
      new<T, U extends Variable<T>>(collectionOf: { new (): U }): VArray<T, U>*/
      <U>(collectionOf: { new (): U }): { new(v?: any[]): VArray<U> }
      new<U>(collectionOf: { new (): U }): VArray<U>
    }
    entries(): IterableIterator<[T, T]>
    keys(): IterableIterator<T>
    values(): IterableIterator<T>
    clear(): void
    collectionOf: VariableClass
    [Symbol.toStringTag]: string
    [Symbol.iterator]: any
  }
  export class VMap<K = {}, V= {}> extends Variable<Map<K, V>> {
  }
  export class VSet<T = {}> extends Variable<Set<T>> {
  }
  export class VPromise<T> extends Variable<Promise<T>> {
    //to<U>(transform: (T) => VPromise<U> | Variable<U> | Promise<U> | U): VPromise<U>
  }
  export var VString: VariableClass<string, string>
  export type vstring = string & Variable<string>

  export var VNumber: VariableClass<number, number>
  export type vnumber = number & Variable<number>

  export class VBoolean extends Variable<boolean> {
  }
  export class Item extends Variable<any> {
  }
  export class Copy extends Variable<any> {
  }
  export class Transform<T = any> extends Variable<T> {
    protected cachedValue: any
    protected cachedVersion: number
    constructor(source: any, transform: (...v: any[]) => T, sources?: any[])
  }

  export function reactive(initialValue: string): Vstring
  export function reactive(initialValue: number): Vnumber
  export function reactive(initialValue: boolean): Boolean & VBoolean
  export function reactive<T>(initialValue: T[]): VArray<T>
  export function reactive<T, K, V>(map: Map<K, V>): VMap<K, V>
  export function reactive<T, V>(set: Set<V>): VSet<V>
  export function reactive<T>(initialValue: T): Reacts<T>
  export function reactive(): Variable

  /**
  * Decorator function to be used for marking properties, classes, methods as reactive
  */
  export function reactive(target: {}, key?: string): void
  export function direct(target: {}, key?: string): void

  export function react<T>(reactiveFunction: () => T): Variable<T>
  /**
  * Compose a new variable based on the provided input variables. The returned variable will hold an array
  * with elements corresponding to the values of the input variables, and will update in response to changes
  * to any of the input variables
  * @param inputs input variables
  */
  export function all<T extends any[]>(inputs: T): Variable<Yield<T>>
  export function all<T extends any[], U>(inputs: T, transform: (...v: Yield<T>) => U): Variable<U>
  /**
  * Compose a new variable based on the provided input variables. The returned variable will hold an array
  * with elements corresponding to the values of the input variables, and will update in response to changes
  * to any of the input variables
  * @param inputs input variables
  */
  export function all<T extends any[]>(...inputs: T): Variable<Yield<T>>

  /**
  * Execute the provided generator or generator iterator, resolving yielded promises and variables
  */
  export function spawn<T>(yieldingFunction: Iterator<T> | (() => T)): Promise<T>

  // operators
  export function not(variable: Variable<any> | any): VBoolean
  export function add(a: Variable<number> | number, b: Variable<number> | number): vnumber
  export function subtract(a: Variable<number> | number, b: Variable<number> | number): vnumber
  export function multiply(a: Variable<number> | number, b: Variable<number> | number): vnumber
  export function divide(a: Variable<number> | number, b: Variable<number> | number): vnumber
  export function remainder(a: Variable<number> | number): vnumber
  export function greater(a: Variable<number> | number, b: Variable<number> | number): VBoolean
  export function greaterOrEqual(a: Variable<number> | number, b: Variable<number> | number): VBoolean
  export function less(a: Variable<number> | number, b: Variable<number> | number): VBoolean
  export function lessOrEqual(a: Variable<number> | number, b: Variable<number> | number): VBoolean
  export function equal(a: Variable<any> | any, b: Variable<any> | any): VBoolean
  export function and(a: Variable<any> | any, b: Variable<any> | any): Variable<any>
  export function or(a: Variable<any> | any, b: Variable<any> | any): Variable<any>
  export function round(a: Variable<number> | number): vnumber

  /*
  * The context used to compute a variable
  */
  export class Context {
      /* A value that represents the entity requesting a value from a variable, allowing a variable
      * to adjust its computation based on who/what is requesting it */
      subject: any
      /* The maximum version number of the sources used to compute the variable (usually accessed after a variable is computed to compare with future computations for differences). */
      version: number
      setVersion(version: number): void
      constructor(subject?: any, notifies?: (receiver: any) => any)
      executeWithin<T>(executor: () => T): T
      newContext(): Context
  }
  /* A response from a variable, given a context with an `ifModifiedSince` that indicates it has not changed*/
  export var NOT_MODIFIED: {}
  /*
  * The current context being used to compute a variable. This primarily accessible from within a `valueOf` call.
  */
  export var currentContext: Context
  interface RendererProperties<T> {
    variable: Variable<T>
    element: HTMLElement
    renderUpdate?: (value: T, element: HTMLElement) => void
    shouldRender?: (element: HTMLElement) => boolean
    alwaysUpdate?: boolean
  }
  interface NamedRendererProperties<T> extends RendererProperties<T> {
    name: string
  }
  export class Renderer<T> {
    constructor(properties: RendererProperties<T>)
  }
  export class ElementRenderer<T> {
    constructor(properties: RendererProperties<T>)
  }
  export class ContentRenderer<T> {
    constructor(properties: RendererProperties<T>)
  }
  export class AttributeRenderer<T> {
    constructor(properties: NamedRendererProperties<T>)
  }
  export class PropertyRenderer<T> {
    constructor(properties: NamedRendererProperties<T>)
  }
  export class StyleRenderer<T> {
    constructor(properties: NamedRendererProperties<T>)
  }
  export class TextRenderer<T> {
    constructor(properties: RendererProperties<T>)
  }
  interface ListRendererProperties<T> extends RendererProperties<T> {
    each: ElementChild | ((value: T, element: HTMLElement) => HTMLElement)
  }
  export class ListRenderer<T> {
    constructor(properties: ListRendererProperties<T>)
  }
  type Vstring = string | Variable<string>
  type Vboolean = boolean | Variable<boolean>
  type Vnumber = number | Variable<number>
  type Vstyle = Vstring | Vnumber | Vboolean

  /**
  * @Deprecated Registers an element with the given tag name, returning a callable, newable constructor for the element
  **/
  export function defineElement<T extends Element>(tagSelect: string, Element: { new(...params: {}[]): T}): ElementClass<T>
  /**
  * @Deprecated Returns a callable, newable constructor for the element
  **/
  export function defineElement<T extends Element>(Element: { new(...params: {}[]): T}): ElementClass<T>

  export type ElementProperties<T = HTMLElement> = {
    [P in keyof T]?: T[P]
  } & BaseElementProperties

  type OptionalElementProperties<T> = {
    [P in keyof T]?: T[P]
  } | BaseElementProperties | {
    [key: string]: any
  }

  interface BaseElementProperties {
    content?: ElementChild
    class?: Vstring
    for?: Vstring
    role?: Vstring
    classes?: {}
    attributes?: {}
    render?: () => any
    created?: (properties: BaseElementProperties) => BaseElementProperties | void
    ready?: (properties: BaseElementProperties) => any

    textContent?: Vstring

    msContentZoomFactor?: Vstring
    msRegionOverflow?: Vstring
    innerHTML?: Vstring
    onariarequest?: (ev: Event) => any
    oncommand?: (ev: Event) => any
    ongotpointercapture?: (ev: PointerEvent) => any
    onlostpointercapture?: (ev: PointerEvent) => any
    onmsgesturechange?: (ev: MSGestureEvent) => any
    onmsgesturedoubletap?: (ev: MSGestureEvent) => any
    onmsgestureend?: (ev: MSGestureEvent) => any
    onmsgesturehold?: (ev: MSGestureEvent) => any
    onmsgesturestart?: (ev: MSGestureEvent) => any
    onmsgesturetap?: (ev: MSGestureEvent) => any
    onmsgotpointercapture?: (ev: MSPointerEvent) => any
    onmsinertiastart?: (ev: MSGestureEvent) => any
    onmslostpointercapture?: (ev: MSPointerEvent) => any
    onmspointercancel?: (ev: MSPointerEvent) => any
    onmspointerdown?: (ev: MSPointerEvent) => any
    onmspointerenter?: (ev: MSPointerEvent) => any
    onmspointerleave?: (ev: MSPointerEvent) => any
    onmspointermove?: (ev: MSPointerEvent) => any
    onmspointerout?: (ev: MSPointerEvent) => any
    onmspointerover?: (ev: MSPointerEvent) => any
    onmspointerup?: (ev: MSPointerEvent) => any
    ontouchcancel?: (ev: TouchEvent) => any
    ontouchend?: (ev: TouchEvent) => any
    ontouchmove?: (ev: TouchEvent) => any
    ontouchstart?: (ev: TouchEvent) => any
    onwebkitfullscreenchange?: (ev: Event) => any
    onwebkitfullscreenerror?: (ev: Event) => any

    accessKey?: Vstring
    contentEditable?: Vstring
    dataset?: {}
    dir?: Vstring
    draggable?: Vboolean
    hidden?: Vboolean
    hideFocus?: Vboolean
    lang?: Vstring
    onabort?: (ev: Event) => any
    onactivate?: (ev: UIEvent) => any
    onbeforeactivate?: (ev: UIEvent) => any
    onbeforecopy?: (ev: DragEvent) => any
    onbeforecut?: (ev: DragEvent) => any
    onbeforedeactivate?: (ev: UIEvent) => any
    onbeforepaste?: (ev: DragEvent) => any
    onblur?: (ev: FocusEvent) => any
    oncanplay?: (ev: Event) => any
    oncanplaythrough?: (ev: Event) => any
    onchange?: (ev: Event) => any
    onclick?: (ev: MouseEvent) => any
    oncontextmenu?: (ev: PointerEvent) => any
    oncopy?: (ev: DragEvent) => any
    oncuechange?: (ev: Event) => any
    oncut?: (ev: DragEvent) => any
    ondblclick?: (ev: MouseEvent) => any
    ondeactivate?: (ev: UIEvent) => any
    ondrag?: (ev: DragEvent) => any
    ondragend?: (ev: DragEvent) => any
    ondragenter?: (ev: DragEvent) => any
    ondragleave?: (ev: DragEvent) => any
    ondragover?: (ev: DragEvent) => any
    ondragstart?: (ev: DragEvent) => any
    ondrop?: (ev: DragEvent) => any
    ondurationchange?: (ev: Event) => any
    onemptied?: (ev: Event) => any
    onended?: (ev: Event) => any
    onerror?: (ev: Event) => any
    onfocus?: (ev: FocusEvent) => any
    oninput?: (ev: Event) => any
    onkeydown?: (ev: KeyboardEvent) => any
    onkeypress?: (ev: KeyboardEvent) => any
    onkeyup?: (ev: KeyboardEvent) => any
    onload?: (ev: Event) => any
    onloadeddata?: (ev: Event) => any
    onloadedmetadata?: (ev: Event) => any
    onloadstart?: (ev: Event) => any
    onmousedown?: (ev: MouseEvent) => any
    onmouseenter?: (ev: MouseEvent) => any
    onmouseleave?: (ev: MouseEvent) => any
    onmousemove?: (ev: MouseEvent) => any
    onmouseout?: (ev: MouseEvent) => any
    onmouseover?: (ev: MouseEvent) => any
    onmouseup?: (ev: MouseEvent) => any
    onmousewheel?: (ev: MouseWheelEvent) => any
    onmscontentzoom?: (ev: UIEvent) => any
    onpaste?: (ev: DragEvent) => any
    onpause?: (ev: Event) => any
    onplay?: (ev: Event) => any
    onplaying?: (ev: Event) => any
    onprogress?: (ev: ProgressEvent) => any
    onratechange?: (ev: Event) => any
    onreset?: (ev: Event) => any
    onscroll?: (ev: UIEvent) => any
    onseeked?: (ev: Event) => any
    onseeking?: (ev: Event) => any
    onselect?: (ev: UIEvent) => any
    onselectstart?: (ev: Event) => any
    onstalled?: (ev: Event) => any
    onsubmit?: (ev: Event) => any
    onsuspend?: (ev: Event) => any
    ontimeupdate?: (ev: Event) => any
    onvolumechange?: (ev: Event) => any
    onwaiting?: (ev: Event) => any
    spellcheck?: Vboolean
    style?: {}
    tabIndex?: Vnumber
    title?: Vstring

    align?: Vstring
    noWrap?: Vboolean
    disabled?: Vboolean
    href?: Vstring
    src?: Vstring

    alignContent?: Vstyle
    alignItems?: Vstyle
    alignSelf?: Vstyle
    animation?: Vstyle
    animationDelay?: Vstyle
    animationDirection?: Vstyle
    animationDuration?: Vstyle
    animationFillMode?: Vstyle
    animationIterationCount?: Vstyle
    animationName?: Vstyle
    animationPlayState?: Vstyle
    animationTimingFunction?: Vstyle
    backfaceVisibility?: Vstyle
    background?: Vstyle
    backgroundAttachment?: Vstyle
    backgroundBlendMode?: Vstyle
    backgroundClip?: Vstyle
    backgroundColor?: Vstyle
    backgroundImage?: Vstyle
    backgroundOrigin?: Vstyle
    backgroundPosition?: Vstyle
    backgroundPositionX?: Vstyle
    backgroundPositionY?: Vstyle
    backgroundRepeat?: Vstyle
    backgroundRepeatX?: Vstyle
    backgroundRepeatY?: Vstyle
    backgroundSize?: Vstyle
    baselineShift?: Vstyle
    border?: Vstyle
    borderBottom?: Vstyle
    borderBottomColor?: Vstyle
    borderBottomLeftRadius?: Vstyle
    borderBottomRightRadius?: Vstyle
    borderBottomStyle?: Vstyle
    borderBottomWidth?: Vstyle
    borderCollapse?: Vstyle
    borderColor?: Vstyle
    borderImage?: Vstyle
    borderImageOutset?: Vstyle
    borderImageRepeat?: Vstyle
    borderImageSlice?: Vstyle
    borderImageSource?: Vstyle
    borderImageWidth?: Vstyle
    borderLeft?: Vstyle
    borderLeftColor?: Vstyle
    borderLeftStyle?: Vstyle
    borderLeftWidth?: Vstyle
    borderRadius?: Vstyle
    borderRight?: Vstyle
    borderRightColor?: Vstyle
    borderRightStyle?: Vstyle
    borderRightWidth?: Vstyle
    borderSpacing?: Vstyle
    borderStyle?: Vstyle
    borderTop?: Vstyle
    borderTopColor?: Vstyle
    borderTopLeftRadius?: Vstyle
    borderTopRightRadius?: Vstyle
    borderTopStyle?: Vstyle
    borderTopWidth?: Vstyle
    borderWidth?: Vstyle
    bottom?: Vstyle
    boxShadow?: Vstyle
    boxSizing?: Vstyle
    bufferedRendering?: Vstyle
    captionSide?: Vstyle
    clear?: Vstyle
    clip?: Vstyle
    clipPath?: Vstyle
    clipRule?: Vstyle
    color?: Vstyle
    colorInterpolation?: Vstyle
    colorInterpolationFilters?: Vstyle
    colorRendering?: Vstyle
    counterIncrement?: Vstyle
    counterReset?: Vstyle
    cursor?: Vstyle
    direction?: Vstyle
    display?: Vstyle
    emptyCells?: Vstyle
    fill?: Vstyle
    fillOpacity?: Vstyle
    fillRule?: Vstyle
    filter?: Vstyle
    flex?: Vstyle
    flexBasis?: Vstyle
    flexDirection?: Vstyle
    flexFlow?: Vstyle
    flexGrow?: Vstyle
    flexShrink?: Vstyle
    flexWrap?: Vstyle
    float?: Vstyle
    floodColor?: Vstyle
    floodOpacity?: Vstyle
    font?: Vstyle
    fontFamily?: Vstyle
    fontFeatureSettings?: Vstyle
    fontKerning?: Vstyle
    fontSize?: Vstyle
    fontStretch?: Vstyle
    fontStyle?: Vstyle
    fontVariant?: Vstyle
    fontVariantLigatures?: Vstyle
    fontWeight?: Vstyle
    height?: Vstyle
    imageRendering?: Vstyle
    isolation?: Vstyle
    justifyContent?: Vstyle
    left?: Vstyle
    letterSpacing?: Vstyle
    lightingColor?: Vstyle
    lineHeight?: Vstyle
    listStyle?: Vstyle
    listStyleImage?: Vstyle
    listStylePosition?: Vstyle
    listStyleType?: Vstyle
    margin?: Vstyle
    marginBottom?: Vstyle
    marginLeft?: Vstyle
    marginRight?: Vstyle
    marginTop?: Vstyle
    marker?: Vstyle
    markerEnd?: Vstyle
    markerMid?: Vstyle
    markerStart?: Vstyle
    mask?: Vstyle
    maskType?: Vstyle
    maxHeight?: Vstyle
    maxWidth?: Vstyle
    maxZoom?: Vstyle
    minHeight?: Vstyle
    minWidth?: Vstyle
    minZoom?: Vstyle
    mixBlendMode?: Vstyle
    motion?: Vstyle
    motionOffset?: Vstyle
    motionPath?: Vstyle
    motionRotation?: Vstyle
    objectFit?: Vstyle
    objectPosition?: Vstyle
    opacity?: Vstyle
    order?: Vstyle
    orientation?: Vstyle
    orphans?: Vstyle
    outline?: Vstyle
    outlineColor?: Vstyle
    outlineOffset?: Vstyle
    outlineStyle?: Vstyle
    outlineWidth?: Vstyle
    overflow?: Vstyle
    overflowWrap?: Vstyle
    overflowX?: Vstyle
    overflowY?: Vstyle
    padding?: Vstyle
    paddingBottom?: Vstyle
    paddingLeft?: Vstyle
    paddingRight?: Vstyle
    paddingTop?: Vstyle
    page?: Vstyle
    pageBreakAfter?: Vstyle
    pageBreakBefore?: Vstyle
    pageBreakInside?: Vstyle
    paintOrder?: Vstyle
    perspective?: Vstyle
    perspectiveOrigin?: Vstyle
    pointerEvents?: Vstyle
    position?: Vstyle
    quotes?: Vstyle
    resize?: Vstyle
    right?: Vstyle
    shapeImageThreshold?: Vstyle
    shapeMargin?: Vstyle
    shapeOutside?: Vstyle
    shapeRendering?: Vstyle
    size?: Vstyle
    speak?: Vstyle
    stopColor?: Vstyle
    stopOpacity?: Vstyle
    stroke?: Vstyle
    strokeDasharray?: Vstyle
    strokeDashoffset?: Vstyle
    strokeLinecap?: Vstyle
    strokeLinejoin?: Vstyle
    strokeMiterlimit?: Vstyle
    strokeOpacity?: Vstyle
    strokeWidth?: Vstyle
    tabSize?: Vstyle
    tableLayout?: Vstyle
    textAlign?: Vstyle
    textAlignLast?: Vstyle
    textAnchor?: Vstyle
    textCombineUpright?: Vstyle
    textDecoration?: Vstyle
    textIndent?: Vstyle
    textOrientation?: Vstyle
    textOverflow?: Vstyle
    textRendering?: Vstyle
    textShadow?: Vstyle
    textTransform?: Vstyle
    top?: Vstyle
    touchAction?: Vstyle
    transform?: Vstyle
    transformOrigin?: Vstyle
    transformStyle?: Vstyle
    transition?: Vstyle
    transitionDelay?: Vstyle
    transitionDuration?: Vstyle
    transitionProperty?: Vstyle
    transitionTimingFunction?: Vstyle
    unicodeBidi?: Vstyle
    unicodeRange?: Vstyle
    userZoom?: Vstyle
    vectorEffect?: Vstyle
    verticalAlign?: Vstyle
    visibility?: Vstyle
    whiteSpace?: Vstyle
    widows?: Vstyle
    width?: Vstyle
    willChange?: Vstyle
    wordBreak?: Vstyle
    wordSpacing?: Vstyle
    wordWrap?: Vstyle
    writingMode?: Vstyle
    zIndex?: Vstyle
    zoom?: Vstyle
    [name: string]: any
  }

  type ElementChild = string | Variable<any> | ElementClass<Node> | VariableClass<any> | Array<ElementChild2> | Node | number | boolean
  type ElementChild2 = string | Variable<any> | ElementClass<Node> | VariableClass<any> | Array<ElementChild3> | Node | number | boolean
  type ElementChild3 = string | Variable<any> | ElementClass<Node> | VariableClass<any> | Array<any> | Node | number | boolean

  export interface ElementClass<Element> {
    new<T> (properties: OptionalElementProperties<Element> | {[P in keyof T]: T[P]}, content?: ElementChild): Element & T
    new (properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    new (selector?: string): Element
    new (content: ElementChild): Element
    new (selector: string, content: ElementChild): Element
    new<T> (selector: string, properties: OptionalElementProperties<Element> | {[P in keyof T]: T[P]}, content?: ElementChild): Element & T
    new (selector: string, properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    (selector?: string): ElementClass<Element>
    (content: ElementChild): ElementClass<Element>
    <T>(properties: OptionalElementProperties<Element> | {[P in keyof T]: T[P]}, content?: ElementChild): ElementClass<Element & T>
    (selector: string, content: ElementChild, properties?: OptionalElementProperties<Element>): ElementClass<Element>
    <T>(selector: string, properties: OptionalElementProperties<Element> | {[P in keyof T]: T[P]}, content?: ElementChild): ElementClass<Element & T>
    create(selector?: string): Element
    create(content: ElementChild): Element
    create(properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    create(selector: string, content: ElementChild): Element
    create(selector: string, properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    with<T>(selector: string, properties: OptionalElementProperties<Element> | {[P in keyof T]: T[P]}, content?: ElementChild): ElementClass<Element & T>
    with<T>(properties: OptionalElementProperties<Element> | {[P in keyof T]: T[P]}, content?: ElementChild): ElementClass<Element & T>
    with(selector: string): ElementClass<Element>
    defineElement<T extends Element>(this: { new(...params: {}[]): T}, tagSelect?: string): ElementClass<T>
    property(key: KeyType): VariableClass<any>
    children: Array<ElementChild>
  }
  export var Element: ElementClass<HTMLElement>

  export var Video: ElementClass<HTMLVideoElement>
  export var Source: ElementClass<HTMLSourceElement>
  export var Media: ElementClass<HTMLMediaElement>
  export var Audio: ElementClass<HTMLAudioElement>
  export var UL: ElementClass<HTMLUListElement>
  export var Track: ElementClass<HTMLTrackElement>
  export var Title: ElementClass<HTMLTitleElement>
  export var TextArea: ElementClass<HTMLTextAreaElement>
  export var Template: ElementClass<HTMLTemplateElement>
  export var TBody: ElementClass<HTMLTableSectionElement>
  export var THead: ElementClass<HTMLTableSectionElement>
  export var TFoot: ElementClass<HTMLTableSectionElement>
  export var TR: ElementClass<HTMLTableRowElement>
  export var Table: ElementClass<HTMLTableElement>
  export var Col: ElementClass<HTMLTableColElement>
  export var ColGroup: ElementClass<HTMLTableColElement>
  export var TH: ElementClass<HTMLTableHeaderCellElement>
  export var TD: ElementClass<HTMLTableDataCellElement>
  export var Caption: ElementClass<HTMLElement>
  export var Style: ElementClass<HTMLStyleElement>
  export var Span: ElementClass<HTMLSpanElement>
  export var Shadow: ElementClass<HTMLElement>
  export var Select: ElementClass<HTMLSelectElement>
  export var Script: ElementClass<HTMLScriptElement>
  export var Quote: ElementClass<HTMLQuoteElement>
  export var Progress: ElementClass<HTMLProgressElement>
  export var Pre: ElementClass<HTMLPreElement>
  export var Picture: ElementClass<HTMLPictureElement>
  export var Param: ElementClass<HTMLParamElement>
  export var P: ElementClass<HTMLParagraphElement>
  export var Output: ElementClass<HTMLElement>
  export var Option: ElementClass<HTMLOptionElement>
  export var OptGroup: ElementClass<HTMLOptGroupElement>
  export var Object: ElementClass<HTMLObjectElement>
  export var OL: ElementClass<HTMLOListElement>
  export var Ins: ElementClass<HTMLElement>
  export var Del: ElementClass<HTMLElement>
  export var Meter: ElementClass<HTMLElement>
  export var Meta: ElementClass<HTMLMetaElement>
  export var Menu: ElementClass<HTMLMenuElement>
  export var Map: ElementClass<HTMLMapElement>
  export var Link: ElementClass<HTMLLinkElement>
  export var Legend: ElementClass<HTMLLegendElement>
  export var Label: ElementClass<HTMLLabelElement>
  export var LI: ElementClass<HTMLLIElement>
  export var KeyGen: ElementClass<HTMLElement>
  export var Image: ElementClass<HTMLImageElement>
  export var Img: ElementClass<HTMLImageElement>
  export var IFrame: ElementClass<HTMLIFrameElement>
  export var H1: ElementClass<HTMLHeadingElement>
  export var H2: ElementClass<HTMLHeadingElement>
  export var H3: ElementClass<HTMLHeadingElement>
  export var H4: ElementClass<HTMLHeadingElement>
  export var H5: ElementClass<HTMLHeadingElement>
  export var H6: ElementClass<HTMLHeadingElement>
  export var Hr: ElementClass<HTMLHeadingElement>
  export var FrameSet: ElementClass<HTMLFrameSetElement>
  export var Frame: ElementClass<HTMLFrameElement>
  export var Form: ElementClass<HTMLFormElement>
  export var Font: ElementClass<HTMLFontElement>
  export var Embed: ElementClass<HTMLEmbedElement>
  export var Em: ElementClass<HTMLElement>
  export var Code: ElementClass<HTMLElement>
  export var Article: ElementClass<HTMLElement>
  export var Aside: ElementClass<HTMLElement>
  export var Figure: ElementClass<HTMLElement>
  export var FigCaption: ElementClass<HTMLElement>
  export var Header: ElementClass<HTMLHeadingElement>
  export var Main: ElementClass<HTMLElement>
  export var Mark: ElementClass<HTMLElement>
  export var MenuItem: ElementClass<HTMLMenuElement>
  export var Nav: ElementClass<HTMLElement>
  export var Section: ElementClass<HTMLElement>
  export var Summary: ElementClass<HTMLElement>
  export var WBr: ElementClass<HTMLElement>
  export var Div: ElementClass<HTMLDivElement>
  export var Dialog: ElementClass<HTMLElement>
  export var Details: ElementClass<HTMLElement>
  export var DataList: ElementClass<HTMLDataListElement>
  export var DL: ElementClass<HTMLElement>
  export var DT: ElementClass<HTMLElement>
  export var DD: ElementClass<HTMLElement>
  export var Canvas: ElementClass<HTMLCanvasElement>
  export var Button: ElementClass<HTMLButtonElement>
  export var Base: ElementClass<HTMLBaseElement>
  export var Br: ElementClass<HTMLElement>
  export var Area: ElementClass<HTMLAreaElement>
  export var A: ElementClass<HTMLElement>
  export var B: ElementClass<HTMLElement>
  export var I: ElementClass<HTMLElement>

  export var Anchor: ElementClass<HTMLAnchorElement>
  export var Paragraph: ElementClass<HTMLParagraphElement>
  export var DList: ElementClass<HTMLDListElement>
  export var UList: ElementClass<HTMLUListElement>
  export var OList: ElementClass<HTMLOListElement>
  export var ListItem: ElementClass<HTMLLIElement>
  export var Input: ElementClass<HTMLInputElement>
  export var TableRow: ElementClass<HTMLTableRowElement>
  export var TableCell: ElementClass<HTMLTableCellElement>
  export var TableHeaderCell: ElementClass<HTMLTableHeaderCellElement>
  export var TableHeader: ElementClass<HTMLTableSectionElement>
  export var TableBody: ElementClass<HTMLTableSectionElement>

  export var Checkbox: ElementClass<HTMLInputElement>
  export var CheckboxInput: ElementClass<HTMLInputElement>
  export var Password: ElementClass<HTMLInputElement>
  export var PasswordInput: ElementClass<HTMLInputElement>
  export var Text: ElementClass<HTMLInputElement>
  export var TextInput: ElementClass<HTMLInputElement>
  export var Submit: ElementClass<HTMLInputElement>
  export var SubmitInput: ElementClass<HTMLInputElement>
  export var Radio: ElementClass<HTMLInputElement>
  export var RadioInput: ElementClass<HTMLInputElement>
  export var Color: ElementClass<HTMLInputElement>
  export var ColorInput: ElementClass<HTMLInputElement>
  export var Date: ElementClass<HTMLInputElement>
  export var DateInput: ElementClass<HTMLInputElement>
  export var DateTime: ElementClass<HTMLInputElement>
  export var DateTimeInput: ElementClass<HTMLInputElement>
  export var Email: ElementClass<HTMLInputElement>
  export var EmailInput: ElementClass<HTMLInputElement>
  export var Month: ElementClass<HTMLInputElement>
  export var MonthInput: ElementClass<HTMLInputElement>
  export var Number: ElementClass<HTMLInputElement>
  export var NumberInput: ElementClass<HTMLInputElement>
  export var Range: ElementClass<HTMLInputElement>
  export var RangeInput: ElementClass<HTMLInputElement>
  export var Search: ElementClass<HTMLInputElement>
  export var SearchInput: ElementClass<HTMLInputElement>
  export var Tel: ElementClass<HTMLInputElement>
  export var TelInput: ElementClass<HTMLInputElement>
  export var Time: ElementClass<HTMLInputElement>
  export var TimeInput: ElementClass<HTMLInputElement>
  export var Url: ElementClass<HTMLInputElement>
  export var UrlInput: ElementClass<HTMLInputElement>
  export var Week: ElementClass<HTMLInputElement>
  export var WeekInput: ElementClass<HTMLInputElement>

  export function assign(element: HTMLElement, properties: ElementProperties): void
  export function append(...args: Array<ElementChild>): HTMLElement
  export function prepend(...args: Array<ElementChild>): HTMLElement
  export function onShowElement(element: Node): void
  export function onElementRemoval(element: Node, onlyChildren?: boolean): void
  export function content<T>(node: T): T
  export function createElement(element: string|Function, properties: ElementProperties, ...children: Array<ElementChild>): ElementClass<HTMLElement>

  export function getNextVersion(): number

  export class ReplacedEvent extends UpdateEvent {}
  export class AddedEvent extends UpdateEvent {}
  export class DeletedEvent extends UpdateEvent {}
  export class ContextualPromise<T> extends Promise<T> {
    constructor(executor: Function)
  }
}
declare module 'alkali' {
  export = alkali
}

declare module 'alkali/extensions/typescript' {
    export function reactive(target: any, key: string): void
}

