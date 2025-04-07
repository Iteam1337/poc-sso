import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import axios from 'axios'

function Dashboard() {
  const { user, logout } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('/api/user')
        setUserData(response.data)
      } catch (error) {
        console.error('Error fetching user data', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  if (loading) {
    return <div>Loading user data...</div>
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="user-info">
        <h2>Welcome, {user.email || user.name || 'User'}</h2>
        <p>You are authenticated!</p>
        
        {userData && (
          <div className="token-info">
            <h3>Token Information</h3>
            <pre>{JSON.stringify(userData, null, 2)}</pre>
          </div>
        )}
      </div>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  )
}

export default Dashboard
