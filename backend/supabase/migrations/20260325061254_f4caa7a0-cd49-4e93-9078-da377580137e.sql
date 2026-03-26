-- Allow organizers to read bookings for their own events
CREATE POLICY "Organizers read event bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = bookings.event_id
    AND events.organizer_id = auth.uid()
  )
);