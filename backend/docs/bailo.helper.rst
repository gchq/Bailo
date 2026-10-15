bailo.helper package
====================

.. note::

   All helper methods raise :class:`~bailo.core.exceptions.BailoException` on
   API errors. These exceptions include the HTTP status code, error message, and
   full error context from the backend (e.g. per-field validation errors for
   model card or datacard updates). See the :mod:`bailo.core.exceptions` module
   documentation for details and usage examples.


.. automodule:: bailo.helper.access_request
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: bailo.helper.datacard
   :members:
   :undoc-members:
   :show-inheritance:
   :inherited-members:

The ``Entry`` base class that every entry kind derives from lives in :mod:`bailo.core.entry`. It is
re-exported from :mod:`bailo.helper.entry` for convenience, and its members are listed again on each
subclass below.

.. automodule:: bailo.helper.entry
   :members: ReleaseMixin
   :undoc-members:
   :show-inheritance:

.. automodule:: bailo.helper.mirroredModel
   :members:
   :undoc-members:
   :show-inheritance:
   :inherited-members:

.. automodule:: bailo.helper.model
   :members:
   :undoc-members:
   :show-inheritance:
   :inherited-members:

.. automodule:: bailo.helper.release
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: bailo.helper.schema
   :members:
   :undoc-members:
   :show-inheritance:
   :member-order: bysource
