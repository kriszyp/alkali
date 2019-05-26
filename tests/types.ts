/// <reference path="../index.d.ts" />
import { Variable, VArray, VNumber, all, reactive, Reacts, VariableClass, Promise as AlkaliPromise } from 'alkali'

// Variable, Primitive-Typed Variable, reactive/Reacts compatibility
let vi = new Variable(1)
let vn = new VNumber(1)
let rn = reactive(1)
let Rn: Reacts<number>
{
  let t = vi
  t.valueOf().toFixed()
  t = vn
  //t = rn
  t = Rn
}
{
  let t = vn
  t.valueOf().toFixed()
  //t = vi
  //t = rn
  t = Rn
}
{
  let t = rn
  t.valueOf().toFixed()
  t = vi
  t = vn
  t = Rn
}
{
  let t = Rn
  t.valueOf().toFixed()
  //t = vi
  t = vn
  //t = rn
}
// put, then
{
  const p = new Variable<string>('p')
  let sr: string | Variable<string> | AlkaliPromise<string> = p.put('string')
  let vr: string | Variable<string> | AlkaliPromise<string> = p.put(new Variable('string var'))
  p.then(s => s.toLowerCase())
}
// subscription
{
  const v = new Variable('a')
  const subscription = v.subscribe(e => {
    const str: string = e.value()
  })
  subscription.unsubscribe()
}

// test heterogeneous variadic types
{
  const vs = new Variable<string>('a').to(s => `[${s}]`)
  const vn = new Variable(new Variable(1))
  const s = 'three'
  const n = 4
  // variadic args
  let a: Variable<[string, number, string, number]> = all(vs, vn, s, n)
  let r = a.to(([str, num, str2, num2]) => {
    let s: string = str, n: number = num, s2: string = str2, n2: number = num2
    str.toLowerCase()
    str2.toLowerCase()
    num.toFixed()
    num2.toFixed()
    return { s: str, n: num }
  }).to(r => {
    r.s.toLowerCase()
    r.n.toFixed()
    return r
  }).valueOf()
  r.s.toLowerCase()
  r.n.toFixed()

  // array arg
  a =  all([vs, vn, s, n])
  r = a.to(([str, num, str2, num2]) => {
    let s: string = str, n: number = num, s2: string = str2, n2: number = num2
    str.toLowerCase()
    str2.toLowerCase()
    num.toFixed()
    num2.toFixed()
    return { s: str, n: num }
  }).to(r => {
    r.s.toLowerCase()
    r.n.toFixed()
    return r
  }).valueOf()
  r.s.toLowerCase()
  r.n.toFixed()
}
{
  // homogeneous primitive array type
  const numberArray = [1,2,3]
  let a: Variable<number[]> = all(numberArray)
  a.to(([one, two, three]) => {
    let n: number = one, n2: number = two, n3: number = three
    one.toFixed()
    two.toFixed()
    three.toFixed()
  })
  // mixed primitive type array
  const mixedArray = ['1', 2] // (string|number)[]
  let b = all(mixedArray).to(([one, two]) => {
    let arg0: string|number = one, arg1: string|number = two
    // guard disambiguates string|number
    if (typeof one === 'string') {
      one.toLowerCase()
    } else {
      // if not string, must be number
      let other: number = one
      one.toFixed()
    }
    if (typeof two === 'number') {
      two.toFixed()
    } else {
      // if not number, must be string
      let other: string = two
      two.toLowerCase()
    }
  })
}
{
  // homogeneous variable array type
  const vnumberArray: Variable<number>[] = [
    new Variable(1),
    new Variable(new Variable(2)),
    new Variable(3).to(n => n*2)
  ]
  let a: Variable<number[]> = all(vnumberArray)
  a.to(([one, two, three]) => {
    let n: number = one
    one.toFixed()
    two.toFixed()
    three.toFixed()
  })
  // mixed variable type array
  const mixedArray = [new Variable('1'), new Variable(2)] // (Variable<string>|Variable<number>)[]
  let b = all(mixedArray).to(([one, two]) => {
    let arg0: string|number = one, arg1: string|number = two
    // guard disambiguates string|number
    if (typeof one === 'string') {
      one.toLowerCase()
    } else {
      // if not string, must be number
      let other: number = one
      one.toFixed()
    }
    if (typeof two === 'number') {
      two.toFixed()
    } else {
      // if not number, must be string
      let other: string = two
      two.toLowerCase()
    }
  })
}

// VArray
{
  const a = new VArray(['a','b'])
  const doubled: VariableClass<boolean, {}> = a.length.to(n => n < 1)
  const reduced = a.map(s => s.toLowerCase()).filter(s => s.split('/')).reduce((memo, s, i) => {
    memo[i] = s
    return memo
  }, { MEMO: true } as { [key: number]: string, MEMO: true })
  const r = reduced.valueOf()
  const b: boolean = r.MEMO
  //r['0']
  const s: string = r[0]
  const l: boolean = a.map(s => s.length).every(n => n < 2).valueOf()
}
// properties
{
  let o = {
    str: 'string',
    num: 1,
    vb: new Variable(true),
    inner: new Variable({
      x: 2,
      y: new Variable({
        a: false
      })
    })
  }
  let vo = new Variable(o)
  const s: string = vo.get('str')
  const num: number = vo.get('num')
  const b: boolean = vo.get('vb')
  const inner = vo.get('inner')
  const x: number = inner.x
  //const y = inner.y
  //const yab: boolean = y.a
  let ps: Variable<string> = vo.property('str')
  let pnum: Variable<number> = vo.property('num')
  let pvb: Variable<boolean> = vo.property('vb')
  let r = pvb.valueOf()
  let pvo = vo.property('inner')
  let pvoy = pvo.property('y')
  let avalue0: boolean = pvoy.get('a')
  let a = pvo.property('y').property('a')
  let avalue1: boolean = a.valueOf()

  vo.set('str', 123) // should fail type check
}