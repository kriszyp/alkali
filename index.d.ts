declare namespace alkali {
  type KeyType = string | number
  interface Promise<T> {
    then<U>(callback?: (T) => U | Promise<U>, errback?: (T) => U | Promise<U>): Promise<U>
  }

  class UpdateEvent {

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
    then<U>(callback?: (T) => U | Promise<U>, errback?: (T) => U | Promise<U>): Promise<U>
    /**
    * Returns a variable corresponding to the property of the value of this variable
    * @param key The name of the property
    */
    property<K extends keyof T>(key: KeyType): Variable<T[K]>
    property<U>(key: KeyType, PropertyClass: { new(): U }): U
    /**
    * Assigns a new value to this variables (which marks it as updated and any listeners will be notified)
    * @param value The new value to assign to the variable. The may be another variable or a promise, which will transitively be resolved
    */
    put(value: T | Variable<T> | Promise<T>, event?: UpdateEvent)
    /**
    * Gets the property value of this variable's value/object. This differs from `property` in that it returns the resolved value, not a variable
    * @param key The name of the property
    */
    get<K extends keyof T>(key: KeyType): T[K]
    /**
    * Assigns a value to the property of this variable's value
    * @param key The name of the property
    * @param value The new value to assign to the property
    */
    set<K extends keyof T>(key: KeyType, value: T[K] | Variable<T[K]> | Promise<T[K]>, event?: UpdateEvent)
    /**
    * Assigns undefined to the property of this variable's value
    * @param key The name of the property
    */
    undefine(key: KeyType)
    /**
    * Proxy the provided variable through this variable
    * @param variable The variable to proxy
    */
    proxy(variable: Variable<T>)
    for(subject: any): Variable<T>
    /**
    * Creates a new variable that is a transform of this variable, using the provided function to compute
    * the value of the new variable based on this variable's value. The returned variable is reactively dependent
    * on this variable. Note that this is computed lazily/as-needed, the transform function is not guaranteed to
    * execute on every change, only as needed by consumers.
    * @param transform The transform function to use to compute the value of the returned variable
    */
    to<U>(transform: (T) => Variable<U> | Promise<U> | U, reverseTransform?: (U) => any): Variable<U>
    /**
    * Indicate that the variable's value has changed (primarily used if the value has been mutated outside the alkali API, and alkali needs to be notified of the change)
    */
    updated()
    /**
    * Subscribe to the variable, calling the listener after changes to the variable's value.
    * @param listener The listener function that will be called after data changes. This will be called on the next micro-turn.
    */
    subscribe(listener: (event: { value:() => T }) => any)
    /**
    * Subscribe to the variable, calling the `next` method after changes to the variable's value.
    * @param listener The listener function that will be called immediately/synchronously after data changes.
    */
    subscribe(observable: { next: (T) => any})
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
    */
    whileResolving<U>(valueUntilResolved: U): Variable<T | U>

    /**
    * Compose a new variable based on the provided input variables. The returned variable will hold an array
    * with elements corresponding to the values of the input variables, and will update in response to changes
    * to any of the input variables
    * @param inputs input variables
    */
    static all<T, U>(inputs: Array<Variable<T>>, transform?: (...v: Array<T>) => U): Variable<U>
    /**
    * Compose a new variable based on the provided input variables. The returned variable will hold an array
    * with elements corresponding to the values of the input variables, and will update in response to changes
    * to any of the input variables
    * @param inputs input variables
    */
    static all<T>(...inputs: Array<Variable<T>>): Variable<Array<T>>
    static with<U>(properties: {[P in keyof U]: { new(): U[P] }}): VariableClass<U>
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
    hasOwn(Target: () => any)

    put(value: T | Variable<T> | Promise<T>)
    valueOf(): T
    then<U>(callback: (T) => U | Promise<U>, errback: (T) => U | Promise<U>): Promise<U>
    for(subject: any): Variable<T2>
    to<U>(transform: (T) => U | Variable<U>): VariableClass<U>
    property<K extends keyof T2>(key: KeyType): VariableClass<T2[K]>
  }

  export type Reacts<T> = T & Variable<T>

  interface VC<U> {
    <T>(properties: T): T & U & VC<T & U>
    new (properties: U): Variable<U>
  }

  export class VArray<T = {}> extends Variable<Array<T>> {
    constructor(value?: Array<T> | Promise<Array<T>> | Variable<Array<T>>)
    /**
    * Return a VArray with the map applied
    */
    map<U>(transform: (T) => U): VArray<U>
    /**
    * Return a VArray with the filter applied
    */
    filter(filterFunction: (T) => any): VArray<T>
    /**
    * Iterate over the current value of the variable array
    */
    forEach(each: (T) => {})
    /**
    * Return a Variable with the reduce applied
    */
    reduce<U>(reducer: (T, U) => U, initialValue?: any): Variable<U>
    /**
    * Return a Variable with the reduceRight applied
    */
    reduceRight<U>(reducer: (T, U) => U, initialValue?: any): Variable<U>
    /**
    * Return a Variable with the some method applied
    */
    some(filter: (T) => any): Variable<boolean>
    /**
    * Return a Variable with the every method applied
    */
    every(filter: (T) => any): Variable<boolean>
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
    static of: {
      /*<T, U extends Variable<T>>(collectionOf: { new (): U }): { new(v?: T[]): VArray<T, U> }
      new<T, U extends Variable<T>>(collectionOf: { new (): U }): VArray<T, U>*/
      <U>(collectionOf: { new (): U }): { new(v?: any[]): VArray<U> }
      new<U>(collectionOf: { new (): U }): VArray<U>
    }
    collectionOf: VariableClass
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
  export class Transform extends Variable<any> {
  }

  /**
  * Decorator function to be used for marking properties, classes, methods as reactive
  */
  export function reactive(target: {}, key?: string): void
  export function direct(target: {}, key?: string): void
  export function react<T>(reactiveFunction: () => T): Variable<T>
  export function react<T>(value: T): Reacts<T>
  /**
  * Compose a new variable based on the provided input variables. The returned variable will hold an array
  * with elements corresponding to the values of the input variables, and will update in response to changes
  * to any of the input variables
  * @param inputs input variables
  */
  export function all<T, U>(inputs: Array<Variable<T>>, transform?: (...v: Array<T>) => U): Variable<U>
  /**
  * Compose a new variable based on the provided input variables. The returned variable will hold an array
  * with elements corresponding to the values of the input variables, and will update in response to changes
  * to any of the input variables
  * @param inputs input variables
  */
  export function all<T>(...inputs: Array<Variable<T>>): Variable<Array<T>>
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
  * Registers an element with the given tag name, returning a callable, newable constructor for the element
  **/
  export function defineElement<T extends Element>(tagSelect: string, Element: { new(...params: {}[]): T}): ElementClass<T>
  /**
  * Returns a callable, newable constructor for the element
  **/
  export function defineElement<T extends Element>(Element: { new(...params: {}[]): T}): ElementClass<T>

  export type ElementProperties<T = HTMLElement> = {
    [P in keyof T]?: T[P]
  } & BaseElementProperties

  type OptionalElementProperties<T> = {
    [P in keyof T]?: T[P]
  } | BaseElementProperties

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
    onmsmanipulationstatechanged?: (ev: MSManipulationEvent) => any
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
    new (selector?: string): Element
    new (content: ElementChild): Element
    new (properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    new (selector: string, content: ElementChild): Element
    new (selector: string, properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    (selector?: string): ElementClass<Element>
    (content: ElementChild): ElementClass<Element>
    (properties: OptionalElementProperties<Element>, content?: ElementChild): ElementClass<Element>
    (selector: string, content: ElementChild, properties?: OptionalElementProperties<Element>): ElementClass<Element>
    (selector: string, properties: OptionalElementProperties<Element>, content?: ElementChild): ElementClass<Element>
    create(selector?: string): Element
    create(content: ElementChild): Element
    create(properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    create(selector: string, content: ElementChild): Element
    create(selector: string, properties: OptionalElementProperties<Element>, content?: ElementChild): Element
    with(content: ElementChild): ElementClass<Element>
    with(properties: OptionalElementProperties<Element>, content?: ElementChild): ElementClass<Element>
    property(key): VariableClass<any>
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

  export function assign(element: HTMLElement, properties: ElementProperties)
  export function append(...args: Array<ElementChild>): HTMLElement
  export function prepend(...args: Array<ElementChild>): HTMLElement
  export function onShowElement(element: Node)
  export function onElementRemoval(element: Node, onlyChildren?: boolean)
  export function content<T>(node: T): T
}
declare module 'alkali' {
    export = alkali
}

declare module 'alkali/extensions/typescript' {
    export function reactive(target: any, key: string)
}