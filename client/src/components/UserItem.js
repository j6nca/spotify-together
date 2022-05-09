import React from 'react'

export default function UserItem({ user }) {
  return (
    <div 
    className="d-flex m-2 align-items-center" 
  >
      <div className="ml-3">
          <div>{user.id} {user.name}</div>
      </div>
  </div>
  )
}
