declare module 'alkali' {
  type KeyType = string|number
  interface Promise<T> {
    then<U>(callback: (T) => U | Promise<U>, errback: (T) => U | Promise<U>): Promise<U>
  }
  export class Variable<T> {
    constructor(value?: T | Array<T> | Promise<T>)
    valueOf(): T
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

    schema: Variable<{}>
    validation: Variable<{}>
    static extend({}): typeof Variable
    static hasOwn(Target: typeof {})
  }
  export function react<T>(reactiveFunction: () => T): Variable<T>
  export function all<T>(inputs: Array<Variable<T>>): Variable<Array<T>>
  export function spawn<T>(yieldingFunction: () => T): Promise<T>

  export function not(variable: Variable<any>): Variable<boolean>
  export function add(a: Variable<number>, b: Variable<number>): Variable<number>
  export function subtract(a: Variable<number>, b: Variable<number>): Variable<number>
  export function multiply(a: Variable<number>, b: Variable<number>): Variable<number>
  export function divide(a: Variable<number>, b: Variable<number>): Variable<number>

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
    dataset?: DOMStringMap
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
    style?: CSSStyleDeclaration
    tabIndex?: number
    title?: string

    align?: string
    noWrap?: boolean
    disabled?: boolean

    [name: string]: any
  }

  type ElementChild = string | Variable<any> | ElementClass<HTMLElement> | Array<ElementChild2> | HTMLElement | number
  type ElementChild2 = string | Variable<any> | ElementClass<HTMLElement> | Array<ElementChild3> | HTMLElement | number
  type ElementChild3 = string | Variable<any> | ElementClass<HTMLElement> | Array<any> | HTMLElement | number

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
    property(key): Variable<any>
    children: Array<ElementChild>
  }
  declare var Element: ElementClass<HTMLElement>

  declare var Video: ElementClass<HTMLVideoElement>
  declare var Source: ElementClass<HTMLSourceElement>
  declare var Media: ElementClass<HTMLMediaElement>
  declare var Audio: ElementClass<HTMLAudioElement>
  declare var UL: ElementClass<HTMLUListElement>
  declare var Track: ElementClass<HTMLTrackElement>
  declare var Title: ElementClass<HTMLTitleElement>
  declare var TextArea: ElementClass<HTMLTextAreaElement>
  declare var Template: ElementClass<HTMLTemplateElement>
  declare var TBody: ElementClass<HTMLTableSectionElement>
  declare var THead: ElementClass<HTMLTableSectionElement>
  declare var TFoot: ElementClass<HTMLTableSectionElement>
  declare var TR: ElementClass<HTMLTableRowElement>
  declare var Table: ElementClass<HTMLTableElement>
  declare var Col: ElementClass<HTMLTableColElement>
  declare var ColGroup: ElementClass<HTMLTableColElement>
  declare var TH: ElementClass<HTMLTableHeaderCellElement>
  declare var TD: ElementClass<HTMLTableDataCellElement>
  declare var Caption: ElementClass<HTMLElement>
  declare var Style: ElementClass<HTMLStyleElement>
  declare var Span: ElementClass<HTMLSpanElement>
  declare var Shadow: ElementClass<HTMLElement>
  declare var Select: ElementClass<HTMLSelectElement>
  declare var Script: ElementClass<HTMLScriptElement>
  declare var Quote: ElementClass<HTMLQuoteElement>
  declare var Progress: ElementClass<HTMLProgressElement>
  declare var Pre: ElementClass<HTMLPreElement>
  declare var Picture: ElementClass<HTMLPictureElement>
  declare var Param: ElementClass<HTMLParamElement>
  declare var P: ElementClass<HTMLParagraphElement>
  declare var Output: ElementClass<HTMLElement>
  declare var Option: ElementClass<HTMLOptionElement>
  declare var OptGroup: ElementClass<HTMLOptGroupElement>
  declare var Object: ElementClass<HTMLObjectElement>
  declare var OL: ElementClass<HTMLOListElement>
  declare var Ins: ElementClass<HTMLElement>
  declare var Del: ElementClass<HTMLElement>
  declare var Meter: ElementClass<HTMLElement>
  declare var Meta: ElementClass<HTMLMetaElement>
  declare var Menu: ElementClass<HTMLMenuElement>
  declare var Map: ElementClass<HTMLMapElement>
  declare var Link: ElementClass<HTMLLinkElement>
  declare var Legend: ElementClass<HTMLLegendElement>
  declare var Label: ElementClass<HTMLLabelElement>
  declare var LI: ElementClass<HTMLLIElement>
  declare var KeyGen: ElementClass<HTMLElement>
  declare var Image: ElementClass<HTMLImageElement>
  declare var IFrame: ElementClass<HTMLIFrameElement>
  declare var H1: ElementClass<HTMLHeadingElement>
  declare var H2: ElementClass<HTMLHeadingElement>
  declare var H3: ElementClass<HTMLHeadingElement>
  declare var H4: ElementClass<HTMLHeadingElement>
  declare var H5: ElementClass<HTMLHeadingElement>
  declare var H6: ElementClass<HTMLHeadingElement>
  declare var Hr: ElementClass<HTMLHeadingElement>
  declare var FrameSet: ElementClass<HTMLFrameSetElement>
  declare var Frame: ElementClass<HTMLFrameElement>
  declare var Form: ElementClass<HTMLFormElement>
  declare var Font: ElementClass<HTMLFontElement>
  declare var Embed: ElementClass<HTMLEmbedElement>
  declare var Article: ElementClass<HTMLElement>
  declare var Aside: ElementClass<HTMLElement>
  declare var Figure: ElementClass<HTMLElement>
  declare var FigCaption: ElementClass<HTMLElement>
  declare var Header: ElementClass<HTMLHeadingElement>
  declare var Main: ElementClass<HTMLElement>
  declare var Mark: ElementClass<HTMLElement>
  declare var MenuItem: ElementClass<HTMLMenuElement>
  declare var Nav: ElementClass<HTMLElement>
  declare var Section: ElementClass<HTMLElement>
  declare var Summary: ElementClass<HTMLElement>
  declare var WBr: ElementClass<HTMLElement>
  declare var Div: ElementClass<HTMLDivElement>
  declare var Dialog: ElementClass<HTMLElement>
  declare var Details: ElementClass<HTMLElement>
  declare var DataList: ElementClass<HTMLDataListElement>
  declare var DL: ElementClass<HTMLElement>
  declare var Canvas: ElementClass<HTMLCanvasElement>
  declare var Button: ElementClass<HTMLButtonElement>
  declare var Base: ElementClass<HTMLBaseElement>
  declare var Br: ElementClass<HTMLElement>
  declare var Area: ElementClass<HTMLAreaElement>
  declare var A: ElementClass<HTMLElement>

  declare var Anchor: ElementClass<HTMLAnchorElement>
  declare var Paragraph: ElementClass<HTMLParagraphElement>
  declare var DList: ElementClass<HTMLDListElement>
  declare var UList: ElementClass<HTMLUListElement>
  declare var OList: ElementClass<HTMLOListElement>
  declare var ListItem: ElementClass<HTMLLIElement>
  declare var Input: ElementClass<HTMLInputElement>
  declare var TableRow: ElementClass<HTMLTableRowElement>
  declare var TableCell: ElementClass<HTMLTableCellElement>
  declare var TableHeaderCell: ElementClass<HTMLTableHeaderCellElement>
  declare var TableHeader: ElementClass<HTMLTableSectionElement>
  declare var TableBody: ElementClass<HTMLTableSectionElement>

  declare var Checkbox: ElementClass<HTMLInputElement>
  declare var CheckboxInput: ElementClass<HTMLInputElement>
  declare var Password: ElementClass<HTMLInputElement>
  declare var PasswordInput: ElementClass<HTMLInputElement>
  declare var Text: ElementClass<HTMLInputElement>
  declare var TextInput: ElementClass<HTMLInputElement>
  declare var Submit: ElementClass<HTMLInputElement>
  declare var SubmitInput: ElementClass<HTMLInputElement>
  declare var Radio: ElementClass<HTMLInputElement>
  declare var RadioInput: ElementClass<HTMLInputElement>
  declare var Color: ElementClass<HTMLInputElement>
  declare var ColorInput: ElementClass<HTMLInputElement>
  declare var Date: ElementClass<HTMLInputElement>
  declare var DateInput: ElementClass<HTMLInputElement>
  declare var DateTime: ElementClass<HTMLInputElement>
  declare var DateTimeInput: ElementClass<HTMLInputElement>
  declare var Email: ElementClass<HTMLInputElement>
  declare var EmailInput: ElementClass<HTMLInputElement>
  declare var Month: ElementClass<HTMLInputElement>
  declare var MonthInput: ElementClass<HTMLInputElement>
  declare var Number: ElementClass<HTMLInputElement>
  declare var NumberInput: ElementClass<HTMLInputElement>
  declare var Range: ElementClass<HTMLInputElement>
  declare var RangeInput: ElementClass<HTMLInputElement>
  declare var Search: ElementClass<HTMLInputElement>
  declare var SearchInput: ElementClass<HTMLInputElement>
  declare var Tel: ElementClass<HTMLInputElement>
  declare var TelInput: ElementClass<HTMLInputElement>
  declare var Time: ElementClass<HTMLInputElement>
  declare var TimeInput: ElementClass<HTMLInputElement>
  declare var Url: ElementClass<HTMLInputElement>
  declare var UrlInput: ElementClass<HTMLInputElement>
  declare var Week: ElementClass<HTMLInputElement>
  declare var WeekInput: ElementClass<HTMLInputElement>
}