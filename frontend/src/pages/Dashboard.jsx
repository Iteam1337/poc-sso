import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import axios from 'axios'

function Dashboard() {
  const { user, logout } = useAuth()
  const [apiData, setApiData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchApiData = async () => {
      if (!user) return
      
      try {
        // Call our API with the cookie (withCredentials ensures cookies are sent)
        const response = await axios.get('/api/user', {
          withCredentials: true
        })
        setApiData(response.data)
      } catch (error) {
        console.error('API call failed:', error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchApiData()
  }, [user])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <div className="user-info">
        <h2>Welcome, {user?.name || user?.preferred_username || user?.email || 'User'}</h2>
        <p>You are authenticated directly with Keycloak!</p>

        <div className="token-info">
          <h3>User Information</h3>
          <h4>Keycloak User Info:</h4>
          <pre>{JSON.stringify(user, null, 2)}</pre>

          {apiData && (
            <>
              <h4>API Response:</h4>
              <pre>{JSON.stringify(apiData, null, 2)}</pre>
            </>
          )}
        </div>
      </div>
      <button onClick={logout} className="logout-button">
        Logout
      </button>
    </div>
  )
}

export default Dashboard
