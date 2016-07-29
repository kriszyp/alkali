declare module 'alkali' {
  type KeyType = string|number
  interface Promise<T> {
    then<U>(callback: (T) => U | Promise<U>, errback: (T) => U | Promise<U>): Promise<U>
  }
  export class Variable<T> {
    constructor(value?: T | Array<T> | Promise<T>)
    valueOf(): T | Promise<T>
    property(key: KeyType): Variable<any>
    put(value: T | Variable<T> | Array<T> | Promise<T>)
    get(key: KeyType): any
    set(key: KeyType, value: any)
    undefine(key: KeyType)
    proxy(variable: Variable<T>)
    for(subject: any): Variable<T>
    to<U>(transform: (T) => U | Variable<U> | Promise<U>): Variable<U>
    updated()
    subscribe(listener: (event) => any)

    schema: Variable<{}>
    validation: Variable<{}>
    static extend({}): typeof Variable
    static hasOwn(Target: () => any)

    static for(subject: any): Variable<any>
    static to<U>(transform: (T) => U | Variable<U> | Promise<U>): VariableClass
    static property(key: KeyType): VariableClass
  }

  type VariableClass = typeof Variable

  export class VArray<T> extends Variable<Array<T>> {
    map<U>(transform: (T) => U): Variable<Array<U>>
    filter(filterFunction: (T) => any): Variable<Array<T>>
    reduce<U>(reducer: (T, U) => U): Variable<U>
    reduceRight<U>(reducer: (T, U) => U): Variable<U>
    some(filter: (T) => any): Variable<boolean>
    every(filter: (T) => any): Variable<boolean>
    slice(start: number, end?:number): Variable<T>
    push(...items: T[]): number
    unshift(...items: T[]): number
    pop(): T
    shift(): T
    splice(start: number, end: number, ...items: T[])
  }
  export function react<T>(reactiveFunction: () => T): Variable<T>
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


  interface ElementProperties {
    content?: ElementChild
    class?: string
    for?: string
    role?: string
    classes?: {}
    attributes?: {}
    render?: () => any

    textContent?: string

    msContentZoomFactor?: number
    msRegionOverflow?: string
    innerHTML?: string
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

    accessKey?: string
    contentEditable?: string
    dataset?: {}
    dir?: string
    draggable?: boolean
    hidden?: boolean
    hideFocus?: boolean
    innerText?: string
    lang?: string
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
    outerHTML?: string
    outerText?: string
    spellcheck?: boolean
    style?: {}
    tabIndex?: number
    title?: string

    align?: string
    noWrap?: boolean
    disabled?: boolean

    [name: string]: any
  }

  type ElementChild = string | Variable<any> | ElementClass<HTMLElement> | VariableClass | Array<ElementChild2> | HTMLElement | number
  type ElementChild2 = string | Variable<any> | ElementClass<HTMLElement> | VariableClass | Array<ElementChild3> | HTMLElement | number
  type ElementChild3 = string | Variable<any> | ElementClass<HTMLElement> | VariableClass | Array<any> | HTMLElement | number

  interface ElementClass<Element> {
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
    property(key): VariableClass
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
}