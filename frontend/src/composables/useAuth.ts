import { ref, computed } from 'vue'
import { CognitoUserPool, CognitoUser, AuthenticationDetails } from 'amazon-cognito-identity-js'

const userPoolId = import.meta.env.VITE_USER_POOL_ID
const clientId = import.meta.env.VITE_USER_POOL_CLIENT_ID

const userPool = new CognitoUserPool({
  UserPoolId: userPoolId,
  ClientId: clientId
})

const currentUser = ref<CognitoUser | null>(null)
const authToken = ref<string | null>(localStorage.getItem('authToken'))
const email = ref<string | null>(localStorage.getItem('userEmail'))

export function useAuth() {
  const isAuthenticated = computed(() => !!authToken.value)
  const userEmail = computed(() => email.value)

  const register = async (userEmail: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      userPool.signUp(userEmail, password, [], [], (err, result) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  const login = async (userEmail: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const authenticationDetails = new AuthenticationDetails({
        Username: userEmail,
        Password: password
      })

      const cognitoUser = new CognitoUser({
        Username: userEmail,
        Pool: userPool
      })

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const token = result.getIdToken().getJwtToken()
          authToken.value = token
          email.value = userEmail
          currentUser.value = cognitoUser
          
          localStorage.setItem('authToken', token)
          localStorage.setItem('userEmail', userEmail)
          
          resolve()
        },
        onFailure: (err) => {
          reject(err)
        }
      })
    })
  }

  const logout = async (): Promise<void> => {
    if (currentUser.value) {
      currentUser.value.signOut()
    }
    
    authToken.value = null
    email.value = null
    currentUser.value = null
    
    localStorage.removeItem('authToken')
    localStorage.removeItem('userEmail')
  }

  const getCurrentUser = (): CognitoUser | null => {
    return userPool.getCurrentUser()
  }

  return {
    isAuthenticated,
    userEmail,
    register,
    login,
    logout,
    getCurrentUser
  }
}
