import { Redirect } from 'expo-router';

const index = () => {
  return (
    <Redirect href={"tabs/Dashboard"} />
  )
}

export default index