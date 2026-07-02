/**
 * 将 TypeScript interface 声明转为 Mock.js 模板对象（再 JSON.stringify 供拦截使用）
 */
const ts = require('typescript')

function typeNameText(entityName, sf) {
  if (!entityName) return ''
  if (ts.isIdentifier(entityName)) return entityName.text
  if (ts.isQualifiedName(entityName)) return entityName.right.text
  return entityName.getText(sf)
}

function pickUnionMember(types) {
  if (!types || !types.length) return null
  const filtered = types.filter((t) => {
    if (t.kind === ts.SyntaxKind.NullKeyword || t.kind === ts.SyntaxKind.UndefinedKeyword) return false
    if (ts.isLiteralTypeNode(t) && t.literal && t.literal.kind === ts.SyntaxKind.NullKeyword) return false
    return true
  })
  return filtered[0] || types[0]
}

function normKey(key) {
  return String(key || '').toLowerCase()
}

function mockDigitsString(len) {
  return `@string(\"number\", ${len})`
}

function mockDigitsNumber(len) {
  const min = len <= 1 ? 0 : Math.pow(10, len - 1)
  const max = Math.pow(10, len) - 1
  return `@integer(${min}, ${max})`
}

function isStringTypeNode(typeNode, sf) {
  if (!typeNode) return false
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return true
  if (ts.isTypeReferenceNode(typeNode)) {
    const refName = typeNameText(typeNode.typeName, sf)
    return refName === 'String'
  }
  if (ts.isUnionTypeNode(typeNode)) {
    const picked = pickUnionMember(typeNode.types)
    return picked ? isStringTypeNode(picked, sf) : false
  }
  return false
}

function isNumberTypeNode(typeNode, sf) {
  if (!typeNode) return false
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return true
  if (ts.isTypeReferenceNode(typeNode)) {
    const refName = typeNameText(typeNode.typeName, sf)
    return refName === 'Number'
  }
  if (ts.isUnionTypeNode(typeNode)) {
    const picked = pickUnionMember(typeNode.types)
    return picked ? isNumberTypeNode(picked, sf) : false
  }
  return false
}

function keyBasedTemplate(key, typeNode, sf) {
  const k = normKey(key)
  const isStr = isStringTypeNode(typeNode, sf)
  const isNum = isNumberTypeNode(typeNode, sf)

  // billCode: 13位数字
  if (k === 'billcode') {
    if (isStr) return mockDigitsString(13)
    if (isNum) return mockDigitsNumber(13)
  }
  // siteCode: 5位数字
  if (k === 'sitecode') {
    if (isStr) return mockDigitsString(5)
    if (isNum) return mockDigitsNumber(5)
  }
  // weight: 5位数字 + 2位小数（如 12345.67）
  // 兼容 weight/volumeWeight/dispVolumeWeight 等
  if (k.includes('weight')) {
    // Mock.js 特性：当字符串仅包含一个占位符（如 '@float(...)'）时，会返回 number；
    // 这里按字段类型控制返回类型：
    // - string: 拼接成 'xxxxx.xx'，确保结果为字符串
    // - number: 使用 @float 直接返回数字
    if (isStr) return '@string(\"number\", 5).@string(\"number\", 2)'
    if (isNum) return '@float(10000, 99999, 2, 2)'
  }

  const hasDate = k.includes('date')
  const hasTime = k.includes('time')
  if ((hasDate || hasTime) && isStr) {
    if (hasTime) return '@datetime(\"yyyy-MM-dd HH:mm:ss\")'
    return '@date(\"yyyy-MM-dd\")'
  }
  if ((hasDate || hasTime) && isNum) {
    // 13位毫秒时间戳：2000-01-01 ~ 2030-01-01
    return '@integer(946684800000, 1893456000000)'
  }
  return null
}

function typeNodeToTemplateByKey(key, typeNode, ifaceMap, sf, visiting) {
  const byKey = keyBasedTemplate(key, typeNode, sf)
  if (byKey != null) return byKey
  return typeNodeToTemplate(typeNode, ifaceMap, sf, visiting)
}

function interfaceToTemplateObject(iface, ifaceMap, sf, visiting) {
  const name = iface.name.text
  if (visiting.has(name)) return {}
  visiting.add(name)
  const out = {}
  for (const member of iface.members) {
    if (ts.isIndexSignatureDeclaration(member)) continue
    if (!ts.isPropertySignature(member) || !member.type) continue
    const pn = member.name
    let key = null
    if (ts.isIdentifier(pn)) key = pn.text
    else if (ts.isStringLiteral(pn)) key = pn.text
    if (!key) continue
    const ty = member.type
    if (ts.isArrayTypeNode(ty)) {
      const elemT = typeNodeToTemplate(ty.elementType, ifaceMap, sf, visiting)
      out[`${key}|2-4`] = [elemT]
      continue
    }
    if (ts.isTypeReferenceNode(ty)) {
      const refName = typeNameText(ty.typeName, sf)
      if ((refName === 'Array' || refName === 'ReadonlyArray') && ty.typeArguments && ty.typeArguments.length) {
        const elemT = typeNodeToTemplate(ty.typeArguments[0], ifaceMap, sf, visiting)
        out[`${key}|2-4`] = [elemT]
        continue
      }
    }
    out[key] = typeNodeToTemplateByKey(key, ty, ifaceMap, sf, visiting)
  }
  visiting.delete(name)
  return out
}

function typeLiteralToTemplate(node, ifaceMap, sf, visiting) {
  const out = {}
  for (const member of node.members) {
    if (ts.isIndexSignatureDeclaration(member)) continue
    if (!ts.isPropertySignature(member) || !member.type) continue
    const pn = member.name
    let key = null
    if (ts.isIdentifier(pn)) key = pn.text
    else if (ts.isStringLiteral(pn)) key = pn.text
    if (!key) continue
    const ty = member.type
    if (ts.isArrayTypeNode(ty)) {
      const elemT = typeNodeToTemplate(ty.elementType, ifaceMap, sf, visiting)
      out[`${key}|2-4`] = [elemT]
      continue
    }
    if (ts.isTypeReferenceNode(ty)) {
      const refName = typeNameText(ty.typeName, sf)
      if ((refName === 'Array' || refName === 'ReadonlyArray') && ty.typeArguments && ty.typeArguments.length) {
        const elemT = typeNodeToTemplate(ty.typeArguments[0], ifaceMap, sf, visiting)
        out[`${key}|2-4`] = [elemT]
        continue
      }
    }
    out[key] = typeNodeToTemplateByKey(key, ty, ifaceMap, sf, visiting)
  }
  return out
}

function typeNodeToTemplate(typeNode, ifaceMap, sf, visiting) {
  if (!typeNode) return '@string'
  if (ts.isParenthesizedTypeNode(typeNode)) {
    return typeNodeToTemplate(typeNode.type, ifaceMap, sf, visiting)
  }
  if (ts.isUnionTypeNode(typeNode)) {
    const picked = pickUnionMember(typeNode.types)
    return picked ? typeNodeToTemplate(picked, ifaceMap, sf, visiting) : '@string'
  }
  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return '@string'
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return '@integer(1, 100000)'
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return '@boolean'
  if (typeNode.kind === ts.SyntaxKind.AnyKeyword || typeNode.kind === ts.SyntaxKind.UnknownKeyword) {
    return '@string'
  }
  if (ts.isLiteralTypeNode(typeNode) && typeNode.literal) {
    if (ts.isStringLiteral(typeNode.literal)) return typeNode.literal.text
    if (ts.isNumericLiteral(typeNode.literal)) return Number(typeNode.literal.text)
    if (typeNode.literal.kind === ts.SyntaxKind.TrueKeyword) return true
    if (typeNode.literal.kind === ts.SyntaxKind.FalseKeyword) return false
  }
  if (ts.isTypeLiteralNode(typeNode)) {
    return typeLiteralToTemplate(typeNode, ifaceMap, sf, visiting)
  }
  if (ts.isTypeReferenceNode(typeNode)) {
    const refName = typeNameText(typeNode.typeName, sf)
    if (refName === 'Array' || refName === 'ReadonlyArray') {
      if (typeNode.typeArguments && typeNode.typeArguments.length) {
        return typeNodeToTemplate(typeNode.typeArguments[0], ifaceMap, sf, visiting)
      }
      return '@string'
    }
    if (refName === 'Promise' && typeNode.typeArguments && typeNode.typeArguments.length) {
      return typeNodeToTemplate(typeNode.typeArguments[0], ifaceMap, sf, visiting)
    }
    if (refName === 'Date') return '@datetime'
    if (refName === 'String' || refName === 'Number' || refName === 'Boolean') {
      if (refName === 'String') return '@string'
      if (refName === 'Number') return '@integer(1, 100000)'
      return '@boolean'
    }
    if (refName === 'Record' || refName === 'Map' || refName === 'ReadonlyMap') {
      return { 'key|1': '@string', 'val|1': '@string' }
    }
    if (ifaceMap.has(refName)) {
      return interfaceToTemplateObject(ifaceMap.get(refName), ifaceMap, sf, visiting)
    }
    return '@string'
  }
  if (ts.isTupleTypeNode(typeNode) && typeNode.elements.length) {
    return typeNodeToTemplate(typeNode.elements[0], ifaceMap, sf, visiting)
  }
  return '@string'
}

/**
 * @param {string} sourceText
 * @param {string} [preferredRoot='Root'] 优先作为根对象的 interface 名
 * @returns {{ template: object, error: string|null }}
 */
export function tsInterfacesToMockTemplate(sourceText, preferredRoot = 'Root') {
  const text = (sourceText || '').trim()
  if (!text) {
    return { template: {}, error: null }
  }
  try {
    const sf = ts.createSourceFile('schema.ts', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
    const ifaceMap = new Map()
    const walk = (node) => {
      if (ts.isInterfaceDeclaration(node)) {
        ifaceMap.set(node.name.text, node)
      }
      ts.forEachChild(node, walk)
    }
    walk(sf)
    let rootName = preferredRoot
    if (!ifaceMap.has(rootName)) {
      const keys = [...ifaceMap.keys()]
      rootName = keys.length ? keys[0] : null
    }
    if (!rootName || !ifaceMap.has(rootName)) {
      return { template: {}, error: '未找到 interface（优先使用名为 Root 的 interface）' }
    }
    const visiting = new Set()
    const template = interfaceToTemplateObject(ifaceMap.get(rootName), ifaceMap, sf, visiting)
    return { template, error: null }
  } catch (e) {
    return { template: {}, error: (e && e.message) ? e.message : String(e) }
  }
}
