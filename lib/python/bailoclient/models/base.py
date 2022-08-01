from copy import deepcopy
import json
import munch

class BailoBase(munch.AutoMunch):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for k, v in self.items():
            super().__setattr__(k,v) # AutoMunch converts dict values upon setattr

    def _get_self_without_id(self):
        temp = deepcopy(self)
        if '_id' in temp:
            del temp['_id'] 
        return temp

    def __str__(self) -> str: 
        return munch.toJSON(self._get_self_without_id())

    def __dir__(self):
        vals = set(list(munch.iterkeys(self)))
        if '_id' in vals:
            vals.remove('_id')
        vals.add('display')
        vals.add('list_fields')
        return list(vals)

    def display(self, to_screen=True):
        pretty_json = json.dumps(self._get_self_without_id(), indent=4)
        if to_screen:
            print(pretty_json)
        else:
            return pretty_json
