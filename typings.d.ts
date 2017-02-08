declare namespace alkali {
  type KeyType = string | number
  interface Promise<T> {
    then<U>(callback: (T) => U | Promise<U>, errback: (T) => U | Promise<U>): Promise<U>
  }

  class Variable<T> {
    valueOf(): T
    property(key: KeyType): Variable<any>
    property<U>(key: KeyType, PropertyClass: {new (): U}): U
    put(value: T | Variable<T>)
    get(key: KeyType): any
    set(key: KeyType, value: any)
    undefine(key: KeyType)
    proxy(variable: Variable<T>)
    for(subject: any): Variable<T>
    to<U>(transform: (T) => Variable<U> | U): Variable<U>
    updated()
    subscribe(listener: (event) => {
      value: () => T
    })

    static with<U>(properties: {[P in keyof U]: { new (): U[P] }}): VariableClass<U>

    schema: Variable<{}>
    validation: Variable<{}>

    collection: VariableClass<{}>
  }
  export interface VariableClass<T> {
    new(): Variable<any> & T
    new(value?: any): Variable<any> & T
    <U>(properties: {[P in keyof U]: { new (): U[P] }}): VariableClass<T & U>
    with<U>(properties: {[P in keyof U]: { new (): U[P] }}): VariableClass<T & U>
    hasOwn(Target: () => any)

    put(value: T | Variable<T>)
    valueOf(): T
    for(subject: any): Variable<any>
    to<U>(transform: (T) => U | Variable<U>): VariableClass<U>
    property(key: KeyType): VariableClass<any>
  }

  export type Reacts<T> = T & Variable<T>

  interface VC<U> {
    <T>(properties: T): T & U & VC<T & U>
    new (properties: U): Variable<U>
  }

  export class VArray<T, V> extends Variable<Array<T>> {
    map<U>(transform: (V) => U): VArray<U, U>
    filter(filterFunction: (V) => any): VArray<T, V>
    forEach(each: (V) => {})
    reduce<U>(reducer: (T, U) => U): Variable<U>
    reduceRight<U>(reducer: (T, U) => U): Variable<U>
    some(filter: (T) => any): Variable<boolean>
    every(filter: (T) => any): Variable<boolean>
    slice(start: number, end?:number): Variable<T>
    push(...items: T[]): number
    unshift(...items: T[]): number
    pop(): T
    shift(): T
    splice(start: number, end: number, ...items: T[]): T[]
    static of: {
      <U extends Variable<any>>(collectionOf: { new (): U }): { new(v?: any[]): VArray<any, U> }
      new<U extends Variable<any>>(collectionOf: { new (): U }): VArray<any, U>
      <U>(collectionOf: { new (): U }): { new(v?: any[]): VArray<U, U> }
      new<U>(collectionOf: { new (): U }): VArray<U, U>
    }
    collectionOf: VariableClass<{}>
  }
  export class VMap<T> extends Variable<T> {
  }
  export class VSet<T> extends Variable<T> {    
  }
  export class VPromise<T> extends Variable<Promise<T>> {
    to<U>(transform: (T) => VPromise<U> | Variable<U> | Promise<U> | U): VPromise<U>
  }
  export var VString: {
    (v?: string): Variable<string> & string
    new (v?: string): Variable<string> & string
  }
  export var VNumber: {
    (v?: number): Variable<number> & number
    new (v?: number): Variable<number> & number
  }
  export var VBoolean: {
    (v?: boolean): Variable<boolean> & boolean
    new (v?: boolean): Variable<boolean> & boolean
  }

  export function react<T>(reactiveFunction: () => T): Variable<T>
  export function react<T>(value: T): Reacts<T>
  export function all<T>(inputs: Array<Variable<T>>): Variable<Array<T>>
  export function spawn<T>(yieldingFunction: () => T): Promise<T>

  // operators
  export function not(variable: Variable<any> | any): Variable<boolean>
  export function add(a: Variable<number> | number, b: Variable<number> | number): Variable<number>
  export function subtract(a: Variable<number> | number, b: Variable<number> | number): Variable<number>
  export function multiply(a: Variable<number> | number, b: Variable<number> | number): Variable<number>
  export function divide(a: Variable<number> | number, b: Variable<number> | number): Variable<number>
  export function remainder(a: Variable<number> | number): Variable<number>
  export function greater(a: Variable<number> | number, b: Variable<number> | number): Variable<boolean>
  export function greaterOrEqual(a: Variable<number> | number, b: Variable<number> | number): Variable<boolean>
  export function less(a: Variable<number> | number, b: Variable<number> | number): Variable<boolean>
  export function lessOrEqual(a: Variable<number> | number, b: Variable<number> | number): Variable<boolean>
  export function equal(a: Variable<any> | any, b: Variable<any> | any): Variable<boolean>
  export function and(a: Variable<any> | any, b: Variable<any> | any): Variable<any>
  export function or(a: Variable<any> | any, b: Variable<any> | any): Variable<any>
  export function round(a: Variable<number> | number): Variable<number>

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

  interface ElementProperties {
    content?: ElementChild
    class?: Vstring
    for?: Vstring
    role?: Vstring
    classes?: {}
    attributes?: {}
    render?: () => any
    created?: (properties: ElementProperties) => ElementProperties | void
    ready?: (properties: ElementProperties) => any

    textContent?: Vstring

    msContentZoomFactor?: Vstring
    msRegionOverflow?: Vstring
    innerHTML?: Vstring
    onariarequest?: (ev: AriaRequestEvent) => any
    oncommand?: (ev: CommandEvent) => any
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

  type ElementChild = string | Variable<any> | ElementClass<Node> | VariableClass<any> | Array<ElementChild2> | Node | number
  type ElementChild2 = string | Variable<any> | ElementClass<Node> | VariableClass<any> | Array<ElementChild3> | Node | number
  type ElementChild3 = string | Variable<any> | ElementClass<Node> | VariableClass<any> | Array<any> | Node | number

  export interface ElementClass<Element> {
    new (selector?: string): Element
    new (content: ElementChild): Element
    new (properties: ElementProperties, content?: ElementChild): Element
    new (selector: string, content: ElementChild): Element
    new (selector: string, properties: ElementProperties, content?: ElementChild): Element
    (selector?: string): ElementClass<Element>
    (content: ElementChild): ElementClass<Element>
    (properties: ElementProperties, content?: ElementChild): ElementClass<Element>
    (selector: string, content: ElementChild): ElementClass<Element>
    (selector: string, properties: ElementProperties, content?: ElementChild): ElementClass<Element>
    create(selector?: string): Element
    create(content: ElementChild): Element
    create(properties: ElementProperties, content?: ElementChild): Element
    create(selector: string, content: ElementChild): Element
    create(selector: string, properties: ElementProperties, content?: ElementChild): Element
    with(content: ElementChild): ElementClass<Element>
    with(properties: ElementProperties, content?: ElementChild): ElementClass<Element>
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
}
declare module 'alkali' {
    export = alkali
}

declare module 'alkali/extensions/typescript' {
    export function reactive(target: any, key: string)
}