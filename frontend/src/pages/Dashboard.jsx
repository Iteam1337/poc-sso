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
        // Get user info from OAuth2 Proxy
        const userInfoResponse = await axios.get('/oauth2/userinfo', {
          withCredentials: true
        })
        
        // Also try to get the token and pass it to our API
        if (userInfoResponse.data) {
          try {
            // Call our API with the user info
            const apiResponse = await axios.get('/api/user', {
              headers: {
                'X-Auth-Email': userInfoResponse.data.email,
                'X-Auth-User': userInfoResponse.data.user || userInfoResponse.data.sub
              }
            })
            setUserData({
              oauth2User: userInfoResponse.data,
              apiData: apiResponse.data
            })
          } catch (apiError) {
            console.error('Error calling API:', apiError)
            setUserData({
              oauth2User: userInfoResponse.data,
              apiError: apiError.message
            })
          }
        }
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
        <h2>Welcome, {user.email || user.name || user.user || 'User'}</h2>
        <p>You are authenticated!</p>
        
        {userData && (
          <div className="token-info">
            <h3>User Information</h3>
            <h4>OAuth2 Proxy User Info:</h4>
            <pre>{JSON.stringify(userData.oauth2User, null, 2)}</pre>
            
            {userData.apiData && (
              <>
                <h4>API Response:</h4>
                <pre>{JSON.stringify(userData.apiData, null, 2)}</pre>
              </>
            )}
            
            {userData.apiError && (
              <>
                <h4>API Error:</h4>
                <pre>{userData.apiError}</pre>
              </>
            )}
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
