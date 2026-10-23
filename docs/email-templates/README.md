# Customer EmailJS template update

Prepared for review only. No EmailJS dashboard configuration has been changed.

Use customer-order-withdrawal.html as the HTML body of the shared customer template currently identified as template_7u1hj4i. Configure To Email as {{to_email}}, Reply-To as {{support_email}}, and From Name as Softhe.io. Preserve the connected Gmail service and its authenticated sender. Suggested subject: Softhe.io {{#items}}order confirmation{{/items}}{{#request_id}}withdrawal acknowledgement{{/request_id}} - {{order_reference}}.

EmailJS supports Mustache sections such as {{#items}}...{{/items}}, hides sections whose variables are missing or falsy, and escapes double-bracket variables. See https://www.emailjs.com/docs/user-guide/dynamic-variables-templates/. This artifact uses those documented sections and no unescaped HTML variables.

Order parameters are to_email, message_type=order_confirmation, order_reference, items, amount_total, currency, vat_treatment, vat_id, terms_url, withdrawal_url, support_email, legal_name, business_registration_id, and fulfillment_status. The items section selects the order content.

Withdrawal customer parameters are to_email, message_type=customer_acknowledgement, order_reference, requested_items, comments, request_id, received_at, withdrawal_url, and support_email. The request_id section selects the withdrawal content. The operator notification remains a separate template, receives customer_email and message_type=operator_notification, and needs its intended recipient reviewed separately.

The source now supplies the previously missing order message_type and withdrawal support_email. Both templates must be checked with an order sample and a withdrawal sample in EmailJS before saving, then verified with actual isolated deliveries. Existing receipt delivery alone does not verify corrected template rendering. Legal and accounting approval remains a separate release requirement.
