import { supabase } from '../supabaseClient'

// ---------- Catálogos (categorias, funções, unidades) ----------

export async function listCatalog(table) {
  const { data, error } = await supabase.from(table).select('*').order('name')
  if (error) throw error
  return data
}

export async function createCatalogEntry(table, name) {
  const { data, error } = await supabase.from(table).insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function deleteCatalogEntry(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

// ---------- Itens ----------

export async function listItemsFull() {
  const { data, error } = await supabase
    .from('items')
    .select(`
      id, name, quantity, min_quantity, location, created_at,
      category:categories ( id, name ),
      function:functions ( id, name ),
      unit:units ( id, name ),
      item_aliases ( id, alias )
    `)
    .order('name')
  if (error) throw error
  return data
}

export async function createItem(item, aliases) {
  const { data, error } = await supabase.from('items').insert(item).select().single()
  if (error) throw error
  if (aliases && aliases.length) {
    const rows = aliases.map((a) => ({ item_id: data.id, alias: a }))
    const { error: aliasError } = await supabase.from('item_aliases').insert(rows)
    if (aliasError) throw aliasError
  }
  // entrada inicial no histórico
  await supabase.from('movements').insert({
    item_id: data.id,
    type: 'entrada',
    quantity: item.quantity,
    note: 'Cadastro inicial do item',
  })
  return data
}

export async function updateItem(id, item) {
  const { error } = await supabase.from('items').update(item).eq('id', id)
  if (error) throw error
}

export async function deleteItem(id) {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}

export async function addStock(itemId, quantity, currentQuantity, note) {
  const { error } = await supabase
    .from('items')
    .update({ quantity: currentQuantity + quantity })
    .eq('id', itemId)
  if (error) throw error
  await supabase.from('movements').insert({
    item_id: itemId,
    type: 'entrada',
    quantity,
    note: note || 'Reabastecimento',
  })
}

export async function replaceAliases(itemId, aliases) {
  const { error: delError } = await supabase.from('item_aliases').delete().eq('item_id', itemId)
  if (delError) throw delError
  if (aliases && aliases.length) {
    const rows = aliases.map((a) => ({ item_id: itemId, alias: a }))
    const { error } = await supabase.from('item_aliases').insert(rows)
    if (error) throw error
  }
}

// ---------- Requisições ----------

export async function createRequest(request) {
  const { error } = await supabase.from('requests').insert(request)
  if (error) throw error
}

export async function listPendingRequests() {
  const { data, error } = await supabase
    .from('requests')
    .select('*, item:items ( id, name, quantity, unit:units ( name ) )')
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export async function resolveRequest(request, approve) {
  if (approve) {
    if (request.item.quantity < request.quantity) {
      throw new Error('Quantidade em estoque insuficiente para confirmar esta saída.')
    }
    const { error: updItemError } = await supabase
      .from('items')
      .update({ quantity: request.item.quantity - request.quantity })
      .eq('id', request.item.id)
    if (updItemError) throw updItemError

    await supabase.from('movements').insert({
      item_id: request.item.id,
      type: 'saida',
      quantity: request.quantity,
      requester_name: request.requester_name,
      requester_sector: request.requester_sector,
      note: request.note,
    })
  }

  const { error } = await supabase
    .from('requests')
    .update({ status: approve ? 'confirmado' : 'recusado', resolved_at: new Date().toISOString() })
    .eq('id', request.id)
  if (error) throw error
}

// ---------- Histórico ----------

export async function listMovements() {
  const { data, error } = await supabase
    .from('movements')
    .select('*, item:items ( name )')
    .order('created_at', { ascending: false })
    .limit(300)
  if (error) throw error
  return data
}
