type Element = string
type Modifiers = Record<string, any>
type Props = Element | [Element, Modifiers?] | Modifiers

function toSnakeCase(value: string) {
  return value.split(/(?=[A-Z])/).join('-').toLowerCase()
}

export function getClassList(block: string, props: Props): string[] {
  if (
    typeof props !== 'string'
    && !Array.isArray(props)
    && props !== undefined
    && typeof props !== 'object'
  )
    throw new Error('Value of bem class directive must be string, array or object')
  props = <Props>props
  let classList = [block]
  if (props) {
    if (typeof props === 'string' || Array.isArray(props)) {
      const element = typeof props === 'string' ? props : props[0]
      if (element)
        classList = [`${block}__${element}`]
    }
    const modifiers = props[1] || props
    if (typeof modifiers === 'object') {
      Object.entries(modifiers).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          if (value)
            classList.push(`${classList[0]}--${toSnakeCase(key)}`)
        }
        else {
          classList.push(`${classList[0]}--${toSnakeCase(key)}-${value}`)
        }
      })
    }
  }
  return classList
}

export function useBemClass() {
  const context = getCurrentInstance()
  if (context === null)
    throw new Error('Component context is null')
  const componentName = (context?.vnode.type as any).name as string
  const block = toSnakeCase(componentName)

  return {
    mounted(el: HTMLElement, { value }: { value: Props }) {
      const classList = getClassList(block, value)
      console.log(classList)
      classList.forEach((item) => {
        el.classList.add(item)
      })
    },
    updated(el: HTMLElement, { value }: { value: Props }) {
      const classList = getClassList(block, value)
      console.log(classList)
      classList.forEach((item) => {
        el.classList.add(item)
      })
    },
  }
}

export default {
  useBemClass,
}
