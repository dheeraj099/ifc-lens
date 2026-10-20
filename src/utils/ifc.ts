import * as WEBIFC from 'web-ifc'
import type { IFCProperty, IFCPropertySet, SelectedElement } from '../types'

// Build reverse lookup: type number → IFC type name string
const TYPE_NAMES: Record<number, string> = {}
for (const [key, val] of Object.entries(WEBIFC)) {
  if (typeof val === 'number' && key.startsWith('IFC')) {
    TYPE_NAMES[val] = key
  }
}

export function getTypeName(typeCode: number): string {
  const raw = TYPE_NAMES[typeCode] ?? `TYPE_${typeCode}`
  // IFCWALL → Wall, IFCBEAM → Beam, etc.
  return raw
    .replace(/^IFC/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveValue(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object' && val !== null) {
    const v = val as Record<string, unknown>
    if (v.value !== undefined) return String(v.value)
    if (v.expressID !== undefined) return `#${v.expressID}`
    return JSON.stringify(val)
  }
  return String(val)
}

export async function getSelectedElement(
  ifcAPI: WEBIFC.IfcAPI,
  modelID: number,
  expressId: number
): Promise<SelectedElement> {
  const lineType = ifcAPI.GetLineType(modelID, expressId)
  const typeName = getTypeName(lineType)
  const item = ifcAPI.GetLine(modelID, expressId)

  const name = resolveValue(item.Name) || ''
  const globalId = resolveValue(item.GlobalId) || ''
  const description = resolveValue(item.Description) || ''
  const tag = resolveValue(item.Tag) || ''

  const propertySets = await extractPropertySets(ifcAPI, modelID, expressId)

  return { expressId, typeName, name, globalId, description, tag, propertySets }
}

async function extractPropertySets(
  ifcAPI: WEBIFC.IfcAPI,
  modelID: number,
  expressId: number
): Promise<IFCPropertySet[]> {
  const result: IFCPropertySet[] = []

  try {
    const relIDs = ifcAPI.GetLineIDsWithType(modelID, WEBIFC.IFCRELDEFINESBYPROPERTIES)

    for (let i = 0; i < relIDs.size(); i++) {
      const relID = relIDs.get(i)
      const rel = ifcAPI.GetLine(modelID, relID)
      if (!rel.RelatedObjects) continue

      const related = Array.isArray(rel.RelatedObjects)
        ? rel.RelatedObjects
        : [rel.RelatedObjects]

      const isLinked = related.some(
        (r: unknown) =>
          r !== null &&
          typeof r === 'object' &&
          (r as Record<string, unknown>).value === expressId
      )
      if (!isLinked) continue

      const psetRef = rel.RelatingPropertyDefinition
      if (!psetRef?.value) continue

      const pset = ifcAPI.GetLine(modelID, psetRef.value)
      const psetName = resolveValue(pset.Name) || 'Properties'

      const props: IFCProperty[] = []
      const hasProps = pset.HasProperties

      if (hasProps) {
        const propList = Array.isArray(hasProps) ? hasProps : [hasProps]
        for (const propRef of propList) {
          if (!propRef?.value) continue
          try {
            const prop = ifcAPI.GetLine(modelID, propRef.value)
            const propName = resolveValue(prop.Name)
            if (!propName) continue

            let propVal = ''
            if (prop.NominalValue) {
              propVal = resolveValue(prop.NominalValue)
            } else if (prop.EnumerationValues) {
              const evList = Array.isArray(prop.EnumerationValues)
                ? prop.EnumerationValues
                : [prop.EnumerationValues]
              propVal = evList.map(resolveValue).join(', ')
            }

            props.push({ name: propName, value: propVal })
          } catch {
            // Skip malformed property
          }
        }
      }

      if (props.length > 0) {
        result.push({ name: psetName, properties: props })
      }
    }
  } catch {
    // Property set extraction is best-effort
  }

  return result
}
