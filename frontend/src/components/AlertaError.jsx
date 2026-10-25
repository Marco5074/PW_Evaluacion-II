import { UncontrolledAlert } from 'reactstrap'

function AlertaError({ mensaje, onCerrar }) {
  if (!mensaje) {
    return null
  }

  return (
    <UncontrolledAlert color="warning" toggle={onCerrar}>
      {mensaje}
    </UncontrolledAlert>
  )
}

export default AlertaError