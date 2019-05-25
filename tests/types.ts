/// <reference path="../index.d.ts" />
import { Variable, VNumber, all, reactive, Reacts } from 'alkali'

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
