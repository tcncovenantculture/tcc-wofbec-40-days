import { useParams } from 'react-router'
import { RouteStub } from '@/components/route-stub'

export default function PreviewRoute() {
  const { n } = useParams()
  return <RouteStub title={`Preview: day ${n ?? ''}`} phase={1} />
}
