import{Alert, Badge} from 'reactstrap'

function PanelMision({creditos,total}){
    return(
        <Alert color="info">
      <h2>Información de la misión</h2>

      <p>Créditos disponibles: {creditos} Cr</p>

      <p className="mb-0">
        Costo total de carga:{' '}
        <Badge color="dark" pill>
          {total} Cr
        </Badge>
      </p>
    </Alert>
    )
}    
export default PanelMision