declare module alkali {
  type KeyType = string|number
  interface Promise<T> {
    then<U>(callback: (T) => U | Promise<U>, errback: (T) => U | Promise<U>): Promise<U>
  }
  export class Variable<T> {
    constructor(value: T | Array<T> | Promise<U>)
    valueOf(): T
    property(key: KeyType): Variable<any>
    put(value: T | Variable<T> | Array<T> | Promise<U>)
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
    with(selector?: string): ElementClass<Element>
    with(content: ElementChild): ElementClass<Element>
    with(properties: ElementProperties, content?: ElementChild): ElementClass<Element>
    with(selector: string, content: ElementChild): ElementClass<Element>
    with(selector: string, properties: ElementProperties, content?: ElementChild): ElementClass<Element>
    property(key): Variable<any>
    children: Array<ElementChild>
  }
  declare var Element: ElementClass<HTMLElement>

  export type Video = ElementClass<HTMLVideoElement>
  export type Source = ElementClass<HTMLSourceElement>
  export type Media = ElementClass<HTMLMediaElement>
  export type Audio = ElementClass<HTMLAudioElement>
  export type UL = ElementClass<HTMLUListElement>
  export type Track = ElementClass<HTMLTrackElement>
  export type Title = ElementClass<HTMLTitleElement>
  export type TextArea = ElementClass<HTMLTextAreaElement>
  export type Template = ElementClass<HTMLTemplateElement>
  export type TBody = ElementClass<HTMLTableSectionElement>
  export type THead = ElementClass<HTMLTableSectionElement>
  export type TFoot = ElementClass<HTMLTableSectionElement>
  export type TR = ElementClass<HTMLTableRowElement>
  export type Table = ElementClass<HTMLTableElement>
  export type Col = ElementClass<HTMLTableColElement>
  export type ColGroup = ElementClass<HTMLTableColElement>
  export type TH = ElementClass<HTMLTableHeaderCellElement>
  export type TD = ElementClass<HTMLTableDataCellElement>
  export type Caption = ElementClass<HTMLElement>
  export type Style = ElementClass<HTMLStyleElement>
  export type Span = ElementClass<HTMLSpanElement>
  export type Shadow = ElementClass<HTMLElement>
  export type Select = ElementClass<HTMLSelectElement>
  export type Script = ElementClass<HTMLScriptElement>
  export type Quote = ElementClass<HTMLQuoteElement>
  export type Progress = ElementClass<HTMLProgressElement>
  export type Pre = ElementClass<HTMLPreElement>
  export type Picture = ElementClass<HTMLPictureElement>
  export type Param = ElementClass<HTMLParamElement>
  export type P = ElementClass<HTMLParagraphElement>
  export type Output = ElementClass<HTMLElement>
  export type Option = ElementClass<HTMLOptionElement>
  export type OptGroup = ElementClass<HTMLOptGroupElement>
  export type Object = ElementClass<HTMLObjectElement>
  export type OL = ElementClass<HTMLOListElement>
  export type Ins = ElementClass<HTMLElement>
  export type Del = ElementClass<HTMLElement>
  export type Meter = ElementClass<HTMLElement>
  export type Meta = ElementClass<HTMLMetaElement>
  export type Menu = ElementClass<HTMLMenuElement>
  export type Map = ElementClass<HTMLMapElement>
  export type Link = ElementClass<HTMLLinkElement>
  export type Legend = ElementClass<HTMLLegendElement>
  export type Label = ElementClass<HTMLLabelElement>
  export type LI = ElementClass<HTMLLIElement>
  export type KeyGen = ElementClass<HTMLElement>
  export type Image = ElementClass<HTMLImageElement>
  export type IFrame = ElementClass<HTMLIFrameElement>
  export type H1 = ElementClass<HTMLHeadingElement>
  export type H2 = ElementClass<HTMLHeadingElement>
  export type H3 = ElementClass<HTMLHeadingElement>
  export type H4 = ElementClass<HTMLHeadingElement>
  export type H5 = ElementClass<HTMLHeadingElement>
  export type H6 = ElementClass<HTMLHeadingElement>
  export type Hr = ElementClass<HTMLHeadingElement>
  export type FrameSet = ElementClass<HTMLFrameSetElement>
  export type Frame = ElementClass<HTMLFrameElement>
  export type Form = ElementClass<HTMLFormElement>
  export type Font = ElementClass<HTMLFontElement>
  export type Embed = ElementClass<HTMLEmbedElement>
  export type Article = ElementClass<HTMLElement>
  export type Aside = ElementClass<HTMLElement>
  export type Figure = ElementClass<HTMLElement>
  export type FigCaption = ElementClass<HTMLElement>
  export type Header = ElementClass<HTMLHeadingElement>
  export type Main = ElementClass<HTMLElement>
  export type Mark = ElementClass<HTMLElement>
  export type MenuItem = ElementClass<HTMLMenuElement>
  export type Nav = ElementClass<HTMLElement>
  export type Section = ElementClass<HTMLElement>
  export type Summary = ElementClass<HTMLElement>
  export type WBr = ElementClass<HTMLElement>
  export type Div = ElementClass<HTMLDivElement>
  export type Dialog = ElementClass<HTMLElement>
  export type Details = ElementClass<HTMLElement>
  export type DataList = ElementClass<HTMLDataListElement>
  export type DL = ElementClass<HTMLElement>
  export type Canvas = ElementClass<HTMLCanvasElement>
  export type Button = ElementClass<HTMLButtonElement>
  export type Base = ElementClass<HTMLBaseElement>
  export type Br = ElementClass<HTMLElement>
  export type Area = ElementClass<HTMLAreaElement>
  export type A = ElementClass<HTMLElement>

  export type Anchor = ElementClass<HTMLAnchorElement>
  export type Paragraph = ElementClass<HTMLParagraphElement>
  export type DList = ElementClass<HTMLDListElement>
  export type UList = ElementClass<HTMLUListElement>
  export type OList = ElementClass<HTMLOListElement>
  export type ListItem = ElementClass<HTMLLIElement>
  export type Input = ElementClass<HTMLInputElement>
  export type TableRow = ElementClass<HTMLTableRowElement>
  export type TableCell = ElementClass<HTMLTableCellElement>
  export type TableHeaderCell = ElementClass<HTMLTableHeaderCellElement>
  export type TableHeader = ElementClass<HTMLTableSectionElement>
  export type TableBody = ElementClass<HTMLTableSectionElement>

  export type Checkbox = ElementClass<HTMLInputElement>
  export type CheckboxInput = ElementClass<HTMLInputElement>
  export type Password = ElementClass<HTMLInputElement>
  export type PasswordInput = ElementClass<HTMLInputElement>
  export type Text = ElementClass<HTMLInputElement>
  export type TextInput = ElementClass<HTMLInputElement>
  export type Submit = ElementClass<HTMLInputElement>
  export type SubmitInput = ElementClass<HTMLInputElement>
  export type Radio = ElementClass<HTMLInputElement>
  export type RadioInput = ElementClass<HTMLInputElement>
  export type Color = ElementClass<HTMLInputElement>
  export type ColorInput = ElementClass<HTMLInputElement>
  export type Date = ElementClass<HTMLInputElement>
  export type DateInput = ElementClass<HTMLInputElement>
  export type DateTime = ElementClass<HTMLInputElement>
  export type DateTimeInput = ElementClass<HTMLInputElement>
  export type Email = ElementClass<HTMLInputElement>
  export type EmailInput = ElementClass<HTMLInputElement>
  export type Month = ElementClass<HTMLInputElement>
  export type MonthInput = ElementClass<HTMLInputElement>
  export type Number = ElementClass<HTMLInputElement>
  export type NumberInput = ElementClass<HTMLInputElement>
  export type Range = ElementClass<HTMLInputElement>
  export type RangeInput = ElementClass<HTMLInputElement>
  export type Search = ElementClass<HTMLInputElement>
  export type SearchInput = ElementClass<HTMLInputElement>
  export type Tel = ElementClass<HTMLInputElement>
  export type TelInput = ElementClass<HTMLInputElement>
  export type Time = ElementClass<HTMLInputElement>
  export type TimeInput = ElementClass<HTMLInputElement>
  export type Url = ElementClass<HTMLInputElement>
  export type UrlInput = ElementClass<HTMLInputElement>
  export type Week = ElementClass<HTMLInputElement>
  export type WeekInput = ElementClass<HTMLInputElement>

}