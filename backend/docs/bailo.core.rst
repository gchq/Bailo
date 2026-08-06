bailo.core package
==================

*The Bailo core package contains support with one to one endpoints with Bailo. It is recommended to use the helper package for most uses*


.. automodule:: bailo.core.agent
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: bailo.core.client
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: bailo.core.enums
   :members:
   :undoc-members:
   :show-inheritance:
   :exclude-members: ValuedEnum

Error Handling
--------------

All API calls raise :class:`~bailo.core.exceptions.BailoException` when the
backend returns an error response. The exception carries structured detail from
the server:

* ``status_code`` - the HTTP status code (e.g. ``400``, ``404``).
* ``message`` - the human-readable error message.
* ``context`` - a dict of additional detail. For schema validation failures this
  includes a ``validationErrors`` list describing each field that failed.

.. code-block:: python

   from bailo.core.exceptions import BailoException

   try:
       client.put_model_card(model_id=model_id, metadata=invalid_metadata)
   except BailoException as e:
       print(e.status_code)                    # 400
       print(e.message)                        # "Model metadata could not be validated..."
       for err in e.context["validationErrors"]:
           print(f"  {err['property']}: {err['message']}")

       # Or simply print the formatted error:
       print(e)

.. automodule:: bailo.core.exceptions
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: bailo.core.utils
   :members:
   :undoc-members:
   :show-inheritance:
