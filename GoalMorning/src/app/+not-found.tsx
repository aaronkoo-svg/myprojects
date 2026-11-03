import { Redirect } from 'expo-router';

// 알 수 없는 주소로 들어오면 첫 화면으로
export default function NotFound() {
  return <Redirect href="/" />;
}
