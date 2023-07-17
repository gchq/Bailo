import { useState } from 'react'

const [teams, _setTeams] = useState(['Team One', 'TEam Two', 'Team Three'])
const [modelNames, _setModelNames] = useState(['Model Alpha', 'Model Beta', 'Model Charlie'])

export default function Selector() {

    
    const Selector = ({
        selectorOption,
        selectorOptionValues,
      
      }) => {
        let priorityItems;
        if (selectorOption.getPriorityItems) {
          priorityItems = selectorOption.getPriorityItems();
        } else {
          priorityItems = [];
        }
      
        if (selectorOptionValues) {
          selectorOption.values = selectorOptionValues;
        }
  
    
        <Selector
        selectorOption={SelectorOptions.authors}
        selectorOptionValues={UserStore.getUsers()}
        onItemChange={(newAuthors) => EditProjectStore.setAuthors(newAuthors)}
        selectedItems={[...project.authors]}
        required={false}
      />
  



}
