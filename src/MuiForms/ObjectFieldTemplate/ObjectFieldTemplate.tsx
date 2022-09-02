import Grid from '@mui/material/Grid'
import makeStyles from '@mui/styles/makeStyles'
import { ObjectFieldTemplateProps, utils } from '@rjsf/core'
import React from 'react'
import AddButton from '../AddButton/AddButton'

const { canExpand } = utils

const useStyles = makeStyles({
  root: {
    marginTop: 10,
  },
})

function ObjectFieldTemplate({
  DescriptionField,
  description,
  TitleField,
  title,
  properties,
  required,
  disabled,
  readonly,
  uiSchema,
  idSchema,
  schema,
  formData,
  onAddClick,
}: ObjectFieldTemplateProps) {
  const classes = useStyles()

  return (
    <>
      {(uiSchema['ui:title'] || title) && <TitleField id={`${idSchema.$id}-title`} title={title} required={required} />}
      {description && <DescriptionField id={`${idSchema.$id}-description`} description={description} />}
      <Grid container spacing={2} className={classes.root}>
        {properties.map((element) =>
          // Remove the <Grid> if the inner element is hidden as the <Grid>
          // itself would otherwise still take up space.
          element.hidden ? (
            element.content
          ) : (
            <Grid item xs={12} key={element.content.key} style={{ marginBottom: '10px' }}>
              {element.content}
            </Grid>
          )
        )}
        {canExpand(schema, uiSchema, formData) && (
          <Grid container justifyContent='flex-end'>
            <Grid item>
              <AddButton
                className='object-property-expand'
                onClick={onAddClick(schema)}
                disabled={disabled || readonly}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </>
  )
}

export default ObjectFieldTemplate
