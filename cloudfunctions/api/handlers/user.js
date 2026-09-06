async function login({ cloud, openid }) {
  const db = cloud.database()
  const res = await db.collection('users').where({ openid }).limit(1).get()
  if (res.data.length) return res.data[0]
  const user = {
    openid,
    nickName: '',
    avatarUrl: '',
    createdAt: Date.now()
  }
  const add = await db.collection('users').add({ data: user })
  return { _id: add._id, ...user }
}

async function updateProfile({ cloud, openid, payload }) {
  const db = cloud.database()
  const nickName = String(payload.nickName || '').trim().slice(0, 16)
  const avatarUrl = String(payload.avatarUrl || '').slice(0, 500)
  const found = await db.collection('users').where({ openid }).limit(1).get()
  if (!found.data.length) {
    const user = { openid, nickName, avatarUrl, createdAt: Date.now() }
    const add = await db.collection('users').add({ data: user })
    return { _id: add._id, ...user }
  }
  const current = found.data[0]
  await db.collection('users').doc(current._id).update({
    data: { nickName, avatarUrl }
  })
  return { ...current, nickName, avatarUrl }
}

module.exports = { login, updateProfile }
