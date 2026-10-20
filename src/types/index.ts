export interface IFCProperty {
  name: string
  value: string
  unit?: string
}

export interface IFCPropertySet {
  name: string
  properties: IFCProperty[]
}

export interface SelectedElement {
  expressId: number
  typeName: string
  name: string
  globalId: string
  description: string
  tag: string
  propertySets: IFCPropertySet[]
}
